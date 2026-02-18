'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SettlementType } from '@/lib/types'

export async function getLedgerEntries() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const profileJoins = 'creditor:profiles!creditor_id(id, name, email), debtor:profiles!debtor_id(id, name, email)'
  const adjJoinFull = `${profileJoins}, adjustment:adjustments!adjustment_id(id, type, listing_type, date, original_shift_start, original_shift_end, aspect_trade_id, confirmed_at, status)`
  const adjJoinBasic = `${profileJoins}, adjustment:adjustments!adjustment_id(id, type, listing_type, date, original_shift_start, original_shift_end, confirmed_at, status)`

  // .select() must come before .or()/.order() in the Supabase JS client
  const query = (selectStr: string) =>
    supabase
      .from('ledger_entries')
      .select(`*, ${selectStr}`)
      .or(`creditor_id.eq.${user.id},debtor_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

  // Try full join (with aspect_trade_id), fall back to basic join, then profiles-only
  const { data, error } = await query(adjJoinFull)

  if (!error) return { data: data ?? [], userId: user.id }

  console.error('[getLedgerEntries] Full query error:', error.message)

  const { data: basic, error: basicError } = await query(adjJoinBasic)

  if (!basicError) return { data: basic ?? [], userId: user.id }

  console.error('[getLedgerEntries] Basic join error:', basicError.message)

  const { data: fallback, error: fbError } = await supabase
    .from('ledger_entries')
    .select(`*, ${profileJoins}`)
    .or(`creditor_id.eq.${user.id},debtor_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (fbError) {
    console.error('[getLedgerEntries] Profiles-only fallback error:', fbError.message)
    return { error: 'Failed to fetch ledger entries.' }
  }
  return { data: fallback ?? [], userId: user.id }
}

export async function settleEntry(entryId: string, settlementType: SettlementType) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Verify user is involved in this entry
  const { data: entry } = await supabase
    .from('ledger_entries')
    .select('creditor_id, debtor_id, is_settled')
    .eq('id', entryId)
    .single()

  if (!entry) return { error: 'Ledger entry not found.' }
  if (entry.creditor_id !== user.id && entry.debtor_id !== user.id) {
    return { error: 'Not authorized.' }
  }
  if (entry.is_settled) return { error: 'This entry is already settled.' }

  const validTypes: SettlementType[] = ['COVER_RETURNED', 'CASH', 'FORGIVEN']
  if (!validTypes.includes(settlementType)) {
    return { error: 'Invalid settlement type.' }
  }

  const { error } = await supabase
    .from('ledger_entries')
    .update({
      is_settled: true,
      settled_at: new Date().toISOString(),
      settlement_type: settlementType,
    })
    .eq('id', entryId)

  if (error) {
    console.error('settleEntry error:', error)
    return { error: 'Failed to settle entry.' }
  }

  revalidatePath('/ledger')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Reverse auto-reconciliation when a confirmed cover is cancelled (Phase 9).
 *
 * Only reverses entries that were auto-reconciled by the system.
 * Manual settlements (Cash, Forgiven, or user-initiated Cover Returned) are never touched.
 *
 * Call this with the adjustment_id of the cover being cancelled.
 */
export async function unreconciledByCancel(adjustmentId: string) {
  const supabase = await createClient()

  console.log('[LEDGER_CANCEL] Starting reversal for adjustment:', adjustmentId)

  // Find the ledger entry for the cancelled adjustment
  const { data: cancelledEntry, error: findError } = await supabase
    .from('ledger_entries')
    .select('id, reconciled_with_id, auto_reconciled, is_settled, creditor_id, debtor_id')
    .eq('adjustment_id', adjustmentId)
    .maybeSingle()

  if (findError) {
    console.error('[LEDGER_CANCEL] Find entry error:', findError.message, findError)
    return { error: findError.message }
  }

  if (!cancelledEntry) {
    console.log('[LEDGER_CANCEL] No ledger entry found for adjustment', adjustmentId)
    return { success: true }
  }

  console.log('[LEDGER_CANCEL] Found ledger entry:', JSON.stringify(cancelledEntry))

  // If auto-reconciled, un-settle the paired entry first
  if (cancelledEntry.auto_reconciled && cancelledEntry.reconciled_with_id) {
    console.log('[LEDGER_CANCEL] Entry was auto-reconciled, un-settling paired entry:', cancelledEntry.reconciled_with_id)

    const { data: pairedEntry, error: pairedError } = await supabase
      .from('ledger_entries')
      .select('id, auto_reconciled, is_settled')
      .eq('id', cancelledEntry.reconciled_with_id)
      .single()

    if (pairedError) {
      console.error('[LEDGER_CANCEL] Failed to find paired entry:', pairedError.message)
    } else if (pairedEntry && pairedEntry.auto_reconciled) {
      const { error: unsettle } = await supabase
        .from('ledger_entries')
        .update({
          is_settled: false,
          settled_at: null,
          settlement_type: null,
          reconciled_with_id: null,
          auto_reconciled: false,
        })
        .eq('id', pairedEntry.id)

      if (unsettle) {
        console.error('[LEDGER_CANCEL] Un-settle paired error:', unsettle.message)
      } else {
        console.log('[LEDGER_CANCEL] Successfully un-settled paired entry', pairedEntry.id)
      }
    }
  }

  // Mark the entry as settled first (UPDATE policy exists for creditor/debtor).
  // Then also attempt DELETE — this now works if migration 012 has been applied
  // (adds a DELETE policy). Either way the entry will be gone or settled=true,
  // so the dashboard's is_settled=false count will correctly drop to 0.
  const { error: updateError } = await supabase
    .from('ledger_entries')
    .update({
      is_settled: true,
      settled_at: new Date().toISOString(),
      settlement_type: 'CANCELLED',
      reconciled_with_id: null,
      auto_reconciled: false,
    })
    .eq('id', cancelledEntry.id)

  if (updateError) {
    console.error('[LEDGER_CANCEL] Mark-as-settled failed:', updateError.message)
  } else {
    console.log('[LEDGER_CANCEL] Marked cancelled entry as settled/forgiven:', cancelledEntry.id)
  }

  // Also try to delete the entry so it doesn't linger as a "forgiven" row.
  // This requires the DELETE policy from migration 012. If not applied yet,
  // the delete silently does nothing — but the settled flag already fixes counts.
  const { error: deleteError } = await supabase
    .from('ledger_entries')
    .delete()
    .eq('id', cancelledEntry.id)

  if (deleteError) {
    console.log('[LEDGER_CANCEL] Delete failed (migration 012 may not be applied yet):', deleteError.message)
  } else {
    console.log('[LEDGER_CANCEL] Also deleted ledger entry', cancelledEntry.id)
  }

  revalidatePath('/ledger')
  revalidatePath('/dashboard')
  return { success: true }
}
