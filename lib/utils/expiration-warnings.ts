import { createClient } from '@supabase/supabase-js'
import { notifyConfirmationReminder } from '@/lib/notifications/notify'

/**
 * Finds adjustments expiring within the next 4 hours and sends reminder notifications.
 */
export async function checkExpirationWarnings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const now = new Date()
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000)

  // Find adjustments expiring within 4 hours
  const { data: expiringSoon, error } = await supabase
    .from('adjustments')
    .select('id, creator_id, accepter_id, type, date, expires_at, original_shift_start, original_shift_end')
    .eq('status', 'PENDING_CONFIRMATION')
    .gt('expires_at', now.toISOString())
    .lte('expires_at', fourHoursFromNow.toISOString())

  if (error) {
    console.error('Error checking expiration warnings:', error)
    return { warned: 0, error: error.message }
  }

  if (!expiringSoon || expiringSoon.length === 0) {
    return { warned: 0 }
  }

  for (const adj of expiringSoon) {
    const expiresAt = new Date(adj.expires_at!)
    const hoursLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 3600000)
    const minsLeft = Math.floor(((expiresAt.getTime() - now.getTime()) % 3600000) / 60000)

    if (adj.creator_id && adj.accepter_id) {
      const [creatorRes, accepterRes] = await Promise.all([
        supabase.from('profiles').select('id, name, email, phone').eq('id', adj.creator_id).single(),
        supabase.from('profiles').select('id, name, email, phone').eq('id', adj.accepter_id).single(),
      ])

      if (creatorRes.data && accepterRes.data) {
        notifyConfirmationReminder({
          creator: creatorRes.data,
          accepter: accepterRes.data,
          adjustmentType: adj.type,
          date: adj.date,
          shiftStart: adj.original_shift_start,
          shiftEnd: adj.original_shift_end,
          adjustmentId: adj.id,
          hoursLeft,
          minutesLeft: minsLeft,
        }).catch((err) => console.error(`[NOTIFY] timer warning error for ${adj.id}:`, err))
      }
    }
  }

  return { warned: expiringSoon.length }
}
