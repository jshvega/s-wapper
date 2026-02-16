import { createClient } from '@supabase/supabase-js'

/**
 * Finds adjustments expiring within the next 4 hours and logs warnings.
 * In Phase 7, this will be replaced with real notifications (email/SMS).
 */
export async function checkExpirationWarnings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const now = new Date()
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000)

  // Find adjustments expiring within 4 hours that haven't been warned yet
  const { data: expiringSoon, error } = await supabase
    .from('adjustments')
    .select('id, creator_id, accepter_id, type, date, expires_at')
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

    // Console.log warning for now — real notifications in Phase 7
    console.log(
      `[TIMER WARNING] Adjustment ${adj.id} (${adj.type} on ${adj.date}) expires in ${hoursLeft}h ${minsLeft}m. ` +
      `Creator: ${adj.creator_id}, Accepter: ${adj.accepter_id}. ` +
      `Please enter the Aspect Track ID to confirm.`
    )
  }

  return { warned: expiringSoon.length }
}
