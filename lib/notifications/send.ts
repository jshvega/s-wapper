import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import type { NotificationPreferences, NotificationEventKey } from '@/lib/types'

/**
 * Notification sender service — SERVER ONLY.
 *
 * Uses the service_role key to bypass RLS so notifications can be sent
 * for any user (e.g., by cron jobs). This file must never be imported
 * in client-side code.
 *
 * Sends via Resend when RESEND_API_KEY is present; falls back to console.log.
 */

const FROM_ADDRESS = 'S-WAPPER <noreply@notification.s-wapper.com>'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[Notifications] RESEND_API_KEY not set — email will be logged only, not sent')
    return null
  }
  return new Resend(key)
}

interface SendNotificationParams {
  userId: string
  eventKey: NotificationEventKey
  email: {
    to: string
    subject: string
    html: string
  }
  sms?: {
    to: string
    body: string
  }
  relatedAdjustmentId?: string
}

function getServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    // In dev/demo without a service role key, fall back to anon key.
    // Notifications will still be logged; inserts may be rejected by RLS for cross-user writes.
    console.warn('[Notifications] SUPABASE_SERVICE_ROLE_KEY not set — using anon key (dev/demo mode)')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * Send a notification to a user, respecting their preferences.
 * Logs to console and inserts into the notifications table for tracking.
 */
export async function sendNotification(params: SendNotificationParams) {
  const supabase = getServiceSupabase()

  // Fetch user's notification preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', params.userId)
    .single()

  const prefs: NotificationPreferences = profile?.notification_preferences ?? {
    email: { accepted: true, timer_warning: true, confirmed: true, expired: true, shift_reminder: true, obligation_created: true },
    sms: { accepted: false, timer_warning: false, confirmed: false, expired: false, shift_reminder: false, obligation_created: false },
  }

  // EMAIL
  if (prefs.email[params.eventKey]) {
    const resend = getResend()
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: params.email.to,
          subject: params.email.subject,
          html: params.email.html,
        })
      } catch (err) {
        console.error('[EMAIL] Resend error:', err)
        console.log(
          `[EMAIL FALLBACK] To: ${params.email.to} | Subject: ${params.email.subject}\n` +
          `  Body preview: ${params.email.html.replace(/<[^>]*>/g, '').slice(0, 200)}...`
        )
      }
    } else {
      console.log(
        `[EMAIL] To: ${params.email.to} | Subject: ${params.email.subject}\n` +
        `  Body preview: ${params.email.html.replace(/<[^>]*>/g, '').slice(0, 200)}...`
      )
    }

    // Record in notifications table
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: eventKeyToNotificationType(params.eventKey),
      channel: 'EMAIL',
      status: 'SENT',
      content_summary: params.email.subject,
      related_adjustment_id: params.relatedAdjustmentId ?? null,
      sent_at: new Date().toISOString(),
    })
  }

  // SMS
  if (prefs.sms[params.eventKey] && params.sms?.to) {
    // TODO: Replace with Twilio API call:
    // const twilioClient = twilio(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // )
    // await twilioClient.messages.create({
    //   body: params.sms.body,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: params.sms.to,
    // })
    console.log(`[SMS] To: ${params.sms.to} | Body: ${params.sms.body}`)

    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: eventKeyToNotificationType(params.eventKey),
      channel: 'SMS',
      status: 'SENT',
      content_summary: params.sms.body.slice(0, 100),
      related_adjustment_id: params.relatedAdjustmentId ?? null,
      sent_at: new Date().toISOString(),
    })
  }
}

/** Map our event keys to the notification_type enum in the database. */
function eventKeyToNotificationType(key: NotificationEventKey): string {
  const map: Record<NotificationEventKey, string> = {
    accepted: 'ACCEPTED',
    timer_warning: 'TIMER_WARNING',
    confirmed: 'CONFIRMED',
    expired: 'EXPIRED',
    shift_reminder: 'SHIFT_REMINDER',
    obligation_created: 'OBLIGATION_CREATED',
  }
  return map[key]
}
