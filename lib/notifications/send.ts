import { createClient } from '@supabase/supabase-js'
import type { NotificationPreferences, NotificationEventKey } from '@/lib/types'

/**
 * Notification sender service.
 *
 * For the demo phase, all sends are console.log only.
 * TODO: Replace with actual Resend (email) and Twilio (SMS) calls in production.
 */

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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    // TODO: Replace with Resend API call:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'SWAPPER <noreply@swapper.app>',
    //   to: params.email.to,
    //   subject: params.email.subject,
    //   html: params.email.html,
    // })
    console.log(
      `[EMAIL] To: ${params.email.to} | Subject: ${params.email.subject}\n` +
      `  Body preview: ${params.email.html.replace(/<[^>]*>/g, '').slice(0, 200)}...`
    )

    // Record in notifications table
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: eventKeyToNotificationType(params.eventKey),
      channel: 'EMAIL',
      status: 'SENT', // Would be 'PENDING' until Resend confirms in production
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
