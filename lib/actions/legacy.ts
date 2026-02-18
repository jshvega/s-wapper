'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface LegacyAdjustmentInput {
  type: 'SWAP' | 'COVER'
  date: string
  shift_start: string
  shift_end: string
  other_user_id: string | null
  other_party_name: string | null
  aspect_trade_id: string
  notes: string
  role: 'CREDITOR' | 'DEBTOR'
}

export async function createLegacyAdjustment(input: LegacyAdjustmentInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  console.log('[LEGACY] Creating legacy adjustment. Input:', JSON.stringify(input))
  console.log('[LEGACY] Current user:', user.id)

  // If other_user_id is provided, create a full adjustment + ledger entry
  if (input.other_user_id) {
    // Build the insert object
    const insertData: Record<string, unknown> = {
      type: input.type,
      listing_type: 'REQUEST',
      status: 'CONFIRMED',
      creator_id: user.id,
      accepter_id: input.other_user_id,
      date: input.date,
      original_shift_start: input.shift_start || '08:00:00',
      original_shift_end: input.shift_end || '16:00:00',
      notes: input.notes ? `[Legacy] ${input.notes}` : '[Legacy entry]',
      confirmed_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    }

    // Handle trade ID column name (may be aspect_trade_id or aspect_track_id depending on migration)
    if (input.aspect_trade_id) {
      insertData.aspect_trade_id = input.aspect_trade_id
    }

    console.log('[LEGACY] Insert data:', JSON.stringify(insertData))

    // Try insert with progressively fewer optional columns on failure
    let adj: Record<string, unknown> | null = null
    let adjError: { message: string; code?: string } | null = null

    // Attempt 1: with is_legacy
    const res1 = await supabase
      .from('adjustments')
      .insert({ ...insertData, is_legacy: true })
      .select()
      .single()

    if (res1.error) {
      console.error('[LEGACY] Attempt 1 (with is_legacy) failed:', res1.error.message, res1.error.code)

      // Attempt 2: without is_legacy
      const res2 = await supabase
        .from('adjustments')
        .insert(insertData)
        .select()
        .single()

      if (res2.error) {
        console.error('[LEGACY] Attempt 2 (without is_legacy) failed:', res2.error.message, res2.error.code)

        // Attempt 3: try with old column name aspect_track_id instead of aspect_trade_id
        const insertData3 = { ...insertData }
        if (insertData3.aspect_trade_id) {
          insertData3.aspect_track_id = insertData3.aspect_trade_id
          delete insertData3.aspect_trade_id
        }

        const res3 = await supabase
          .from('adjustments')
          .insert(insertData3)
          .select()
          .single()

        if (res3.error) {
          console.error('[LEGACY] Attempt 3 (old column name) failed:', res3.error.message, res3.error.code, res3.error)
        }

        adj = res3.data
        adjError = res3.error
      } else {
        adj = res2.data
        adjError = null
      }
    } else {
      adj = res1.data
      adjError = null
    }

    if (adjError || !adj) {
      console.error('[LEGACY] All insert attempts failed. Last error:', adjError?.message)
      return { error: `Failed to create legacy adjustment: ${adjError?.message ?? 'unknown error'}` }
    }

    console.log('[LEGACY] Successfully created adjustment:', adj.id)

    // Log
    await supabase.from('adjustment_logs').insert({
      adjustment_id: adj.id as string,
      action: 'CONFIRMED',
      actor_id: user.id,
      metadata: { legacy: true, trade_id: input.aspect_trade_id || null },
    })

    // Create ledger entry for COVER type
    if (input.type === 'COVER') {
      const creditorId = input.role === 'CREDITOR' ? user.id : input.other_user_id
      const debtorId = input.role === 'CREDITOR' ? input.other_user_id : user.id

      console.log('[LEGACY] Creating ledger entry: creditor=', creditorId, 'debtor=', debtorId, 'adj=', adj.id)

      const { error: ledgerError } = await supabase.from('ledger_entries').insert({
        creditor_id: creditorId,
        debtor_id: debtorId,
        adjustment_id: adj.id as string,
        is_settled: false,
      })

      if (ledgerError) {
        console.error('[LEGACY] Ledger insert error:', ledgerError.message, ledgerError)
      } else {
        console.log('[LEGACY] Ledger entry created successfully')
      }
    }

    revalidatePath('/history')
    revalidatePath('/ledger')
    revalidatePath('/calendar')
    return { data: adj }
  }

  // If no registered user, create a pending_debt
  if (!input.other_party_name?.trim()) {
    return { error: 'You must specify either a registered user or a name for the other party.' }
  }

  // Try pending_debts table — may not exist if migration 011 not applied
  const { data: debt, error: debtError } = await supabase
    .from('pending_debts')
    .insert({
      creator_id: user.id,
      type: input.type,
      date: input.date,
      shift_start: input.shift_start || null,
      shift_end: input.shift_end || null,
      other_party_name: input.other_party_name.trim(),
      aspect_trade_id: input.aspect_trade_id || null,
      notes: input.notes || null,
      role: input.role,
    })
    .select()
    .single()

  if (debtError) {
    console.error('[LEGACY] Pending debt insert error:', debtError.message, debtError)
    return { error: `Failed to create pending debt: ${debtError.message}` }
  }

  revalidatePath('/history')
  revalidatePath('/settings')
  return { data: debt, pending: true }
}

export async function getPendingDebts() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized', data: [] }

  const { data, error } = await supabase
    .from('pending_debts')
    .select('*')
    .eq('creator_id', user.id)
    .is('linked_adjustment_id', null)
    .order('date', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data ?? [] }
}
