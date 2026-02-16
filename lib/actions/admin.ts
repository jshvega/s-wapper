'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function expireAdjustmentsNow() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') return { error: 'Admin access required' }

  // Find all expired PENDING_CONFIRMATION adjustments
  const { data: expired, error: fetchError } = await supabase
    .from('adjustments')
    .select('id, creator_id, accepter_id, type, date')
    .eq('status', 'PENDING_CONFIRMATION')
    .lt('expires_at', new Date().toISOString())

  if (fetchError) return { error: 'Failed to fetch expired adjustments' }

  if (!expired || expired.length === 0) {
    return { expired: 0, message: 'No expired adjustments found' }
  }

  let expiredCount = 0

  for (const adj of expired) {
    const { error: updateError } = await supabase
      .from('adjustments')
      .update({
        status: 'EXPIRED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', adj.id)
      .eq('status', 'PENDING_CONFIRMATION')

    if (updateError) continue

    await supabase.from('adjustment_logs').insert({
      adjustment_id: adj.id,
      action: 'EXPIRED',
      actor_id: user.id,
      metadata: { reason: 'manual_admin_expiration' },
    })

    console.log(
      `[ADMIN EXPIRE] Adjustment ${adj.id} (${adj.type} on ${adj.date}) expired by admin ${user.id}`
    )

    expiredCount++
  }

  revalidatePath('/admin')
  revalidatePath('/admin/adjustments')
  revalidatePath('/dashboard')
  revalidatePath('/marketplace')

  return { expired: expiredCount, total: expired.length }
}
