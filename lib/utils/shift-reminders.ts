import { createClient } from '@supabase/supabase-js'
import { notifyShiftReminder } from '@/lib/notifications/notify'
import { formatDateKey } from '@/lib/utils/dates'

/**
 * Send shift reminders for tomorrow's confirmed adjustments.
 * Intended to be called by a daily cron job (e.g. at 6pm).
 *
 * Queries for all CONFIRMED adjustments happening tomorrow,
 * then notifies both parties involved.
 */
export async function sendShiftReminders() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = formatDateKey(tomorrow)

  const { data: adjustments, error } = await supabase
    .from('adjustments')
    .select('id, creator_id, accepter_id, type, date, original_shift_start, original_shift_end, aspect_trade_id')
    .eq('status', 'CONFIRMED')
    .eq('date', tomorrowKey)

  if (error) {
    console.error('Error fetching tomorrow adjustments:', error)
    return { reminded: 0, error: error.message }
  }

  if (!adjustments || adjustments.length === 0) {
    return { reminded: 0 }
  }

  let reminded = 0

  for (const adj of adjustments) {
    if (!adj.creator_id || !adj.accepter_id) continue

    const [creatorRes, accepterRes] = await Promise.all([
      supabase.from('profiles').select('id, name, email, phone').eq('id', adj.creator_id).single(),
      supabase.from('profiles').select('id, name, email, phone').eq('id', adj.accepter_id).single(),
    ])

    if (!creatorRes.data || !accepterRes.data) continue

    // Notify both parties
    for (const recipient of [creatorRes.data, accepterRes.data]) {
      const other = recipient.id === creatorRes.data.id ? accepterRes.data : creatorRes.data

      await notifyShiftReminder({
        recipient,
        otherParty: other,
        adjustmentType: adj.type,
        date: adj.date,
        shiftStart: adj.original_shift_start,
        shiftEnd: adj.original_shift_end,
        tradeId: adj.aspect_trade_id ?? undefined,
        adjustmentId: adj.id,
      }).catch((err) => console.error(`[NOTIFY] shift reminder error for ${adj.id}:`, err))
    }

    reminded++
  }

  console.log(`[CRON] Sent shift reminders for ${reminded} adjustments tomorrow (${tomorrowKey})`)
  return { reminded }
}
