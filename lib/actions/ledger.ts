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

  const { data, error } = await supabase
    .from('ledger_entries')
    .select(
      '*, creditor:profiles!creditor_id(id, name, email), debtor:profiles!debtor_id(id, name, email), adjustment:adjustments!adjustment_id(id, type, listing_type, date, original_shift_start, original_shift_end, aspect_track_id, confirmed_at)'
    )
    .or(`creditor_id.eq.${user.id},debtor_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getLedgerEntries error:', error)
    return { error: 'Failed to fetch ledger entries.' }
  }

  return { data: data ?? [], userId: user.id }
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

  // Find the ledger entry for the cancelled adjustment
  const { data: cancelledEntry } = await supabase
    .from('ledger_entries')
    .select('id, reconciled_with_id, auto_reconciled, is_settled')
    .eq('adjustment_id', adjustmentId)
    .single()

  if (!cancelledEntry) return { error: 'No ledger entry for this adjustment.' }

  // Only reverse if this entry was auto-reconciled
  if (!cancelledEntry.auto_reconciled || !cancelledEntry.reconciled_with_id) {
    // Not auto-reconciled — just delete the cancelled entry's ledger row
    await supabase.from('ledger_entries').delete().eq('id', cancelledEntry.id)
    revalidatePath('/ledger')
    revalidatePath('/dashboard')
    return { success: true }
  }

  // Check the paired entry hasn't been manually re-settled since
  const { data: pairedEntry } = await supabase
    .from('ledger_entries')
    .select('id, auto_reconciled, is_settled')
    .eq('id', cancelledEntry.reconciled_with_id)
    .single()

  if (pairedEntry && pairedEntry.auto_reconciled) {
    // Un-settle the paired entry — restore it to outstanding
    await supabase
      .from('ledger_entries')
      .update({
        is_settled: false,
        settled_at: null,
        settlement_type: null,
        reconciled_with_id: null,
        auto_reconciled: false,
      })
      .eq('id', pairedEntry.id)
  }

  // Delete the cancelled entry's ledger row (the cover never happened)
  await supabase.from('ledger_entries').delete().eq('id', cancelledEntry.id)

  revalidatePath('/ledger')
  revalidatePath('/dashboard')
  return { success: true }
}
