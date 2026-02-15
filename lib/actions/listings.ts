'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateListingInput } from '@/lib/types'

export async function createListing(input: CreateListingInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('adjustments')
    .insert({
      type: input.type,
      listing_type: input.listing_type,
      status: 'DRAFT',
      creator_id: user.id,
      date: input.date,
      original_shift_start: input.original_shift_start,
      original_shift_end: input.original_shift_end,
      desired_shift_start: input.desired_shift_start || null,
      desired_shift_end: input.desired_shift_end || null,
      notes: input.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Create listing error:', error)
    return { error: 'Failed to create listing.' }
  }

  // Log action
  await supabase.from('adjustment_logs').insert({
    adjustment_id: data.id,
    action: 'CREATED',
    actor_id: user.id,
    metadata: {},
  })

  revalidatePath('/listings')
  return { data }
}

export async function publishListing(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Verify ownership
  const { data: existing } = await supabase
    .from('adjustments')
    .select('creator_id, status')
    .eq('id', id)
    .single()

  if (!existing) return { error: 'Listing not found.' }
  if (existing.creator_id !== user.id) return { error: 'Not authorized.' }
  if (existing.status !== 'DRAFT') return { error: 'Only DRAFT listings can be published.' }

  const { data, error } = await supabase
    .from('adjustments')
    .update({ status: 'OPEN', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: 'Failed to publish listing.' }

  await supabase.from('adjustment_logs').insert({
    adjustment_id: id,
    action: 'PUBLISHED',
    actor_id: user.id,
    metadata: {},
  })

  revalidatePath('/listings')
  revalidatePath('/marketplace')
  return { data }
}

export async function deleteListing(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: existing } = await supabase
    .from('adjustments')
    .select('creator_id, status')
    .eq('id', id)
    .single()

  if (!existing) return { error: 'Listing not found.' }
  if (existing.creator_id !== user.id) return { error: 'Not authorized.' }
  if (!['DRAFT', 'OPEN'].includes(existing.status)) {
    return { error: 'Cannot delete a listing that has been accepted.' }
  }

  const { error } = await supabase
    .from('adjustments')
    .update({ status: 'REMOVED', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: 'Failed to remove listing.' }

  await supabase.from('adjustment_logs').insert({
    adjustment_id: id,
    action: 'REMOVED',
    actor_id: user.id,
    metadata: {},
  })

  revalidatePath('/listings')
  revalidatePath('/marketplace')
  return { success: true }
}

export async function acceptListing(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: listing } = await supabase
    .from('adjustments')
    .select('*')
    .eq('id', id)
    .single()

  if (!listing) return { error: 'Listing not found.' }
  if (listing.status !== 'OPEN') return { error: 'This listing is no longer available.' }
  if (listing.creator_id === user.id) return { error: 'You cannot accept your own listing.' }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('adjustments')
    .update({
      status: 'PENDING_CONFIRMATION',
      accepter_id: user.id,
      accepted_at: new Date().toISOString(),
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'OPEN') // Optimistic concurrency
    .select()
    .single()

  if (error || !data) return { error: 'Failed to accept listing. It may have already been taken.' }

  await supabase.from('adjustment_logs').insert({
    adjustment_id: id,
    action: 'ACCEPTED',
    actor_id: user.id,
    metadata: {},
  })

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')
  revalidatePath(`/listings/${id}`)
  return { data }
}

export async function confirmAdjustment(id: string, trackId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: adj } = await supabase
    .from('adjustments')
    .select('*')
    .eq('id', id)
    .single()

  if (!adj) return { error: 'Adjustment not found.' }
  if (adj.status !== 'PENDING_CONFIRMATION') return { error: 'This adjustment is not pending confirmation.' }

  // Verify user is creator or accepter
  if (adj.creator_id !== user.id && adj.accepter_id !== user.id) {
    return { error: 'Not authorized.' }
  }

  // Check not expired
  if (adj.expires_at && new Date(adj.expires_at) < new Date()) {
    return { error: 'This adjustment has expired.' }
  }

  if (!trackId.trim()) return { error: 'Track ID is required.' }

  const { data, error } = await supabase
    .from('adjustments')
    .update({
      status: 'CONFIRMED',
      aspect_track_id: trackId.trim(),
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: 'Failed to confirm adjustment.' }

  // Create ledger entry for COVER type only
  if (adj.type === 'COVER') {
    // creditor = the one who worked (gave the cover)
    // debtor = the one who got time off (received the cover)
    const isCreatorGivingCover = adj.listing_type === 'OFFER'
    const creditorId = isCreatorGivingCover ? adj.creator_id : adj.accepter_id
    const debtorId = isCreatorGivingCover ? adj.accepter_id : adj.creator_id

    await supabase.from('ledger_entries').insert({
      creditor_id: creditorId,
      debtor_id: debtorId,
      adjustment_id: id,
      is_settled: false,
    })
  }

  await supabase.from('adjustment_logs').insert({
    adjustment_id: id,
    action: 'CONFIRMED',
    actor_id: user.id,
    metadata: { track_id: trackId.trim() },
  })

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath(`/listings/${id}`)
  revalidatePath('/ledger')
  return { data }
}
