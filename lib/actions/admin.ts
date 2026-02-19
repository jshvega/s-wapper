'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ---- Helper: verify current user is admin ----

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') throw new Error('Admin access required')

  return { supabase, user }
}

// ---- Expire overdue adjustments (manual trigger) ----

export async function expireAdjustmentsNow() {
  const { supabase, user } = await requireAdmin()

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

    expiredCount++
  }

  revalidatePath('/admin')
  revalidatePath('/admin/adjustments')
  revalidatePath('/dashboard')
  revalidatePath('/marketplace')

  return { expired: expiredCount, total: expired.length }
}

// ---- Force expire a specific adjustment ----

export async function forceExpireAdjustment(adjustmentId: string) {
  const { supabase, user } = await requireAdmin()

  const { data: adj, error: fetchError } = await supabase
    .from('adjustments')
    .select('id, status')
    .eq('id', adjustmentId)
    .single()

  if (fetchError || !adj) return { error: 'Adjustment not found' }
  if (adj.status !== 'PENDING_CONFIRMATION') {
    return { error: `Cannot expire adjustment with status ${adj.status}. Must be PENDING_CONFIRMATION.` }
  }

  const { error: updateError } = await supabase
    .from('adjustments')
    .update({
      status: 'EXPIRED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', adjustmentId)

  if (updateError) return { error: 'Failed to update adjustment' }

  await supabase.from('adjustment_logs').insert({
    adjustment_id: adjustmentId,
    action: 'ADMIN_FORCE_EXPIRED',
    actor_id: user.id,
    metadata: { reason: 'admin_force_expire' },
  })

  revalidatePath('/admin')
  revalidatePath('/admin/adjustments')
  revalidatePath(`/admin/adjustments/${adjustmentId}`)
  revalidatePath('/dashboard')
  revalidatePath('/marketplace')

  return { success: true }
}

// ---- Force confirm a specific adjustment ----

export async function forceConfirmAdjustment(adjustmentId: string, tradeId: string) {
  const { supabase, user } = await requireAdmin()

  if (!tradeId.trim()) return { error: 'Trade ID is required' }

  const { data: adj, error: fetchError } = await supabase
    .from('adjustments')
    .select('id, status, type, creator_id, accepter_id')
    .eq('id', adjustmentId)
    .single()

  if (fetchError || !adj) return { error: 'Adjustment not found' }
  if (adj.status !== 'PENDING_CONFIRMATION') {
    return { error: `Cannot confirm adjustment with status ${adj.status}. Must be PENDING_CONFIRMATION.` }
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('adjustments')
    .update({
      status: 'CONFIRMED',
      aspect_trade_id: tradeId.trim(),
      confirmed_at: now,
      updated_at: now,
    })
    .eq('id', adjustmentId)

  if (updateError) return { error: 'Failed to update adjustment' }

  await supabase.from('adjustment_logs').insert({
    adjustment_id: adjustmentId,
    action: 'ADMIN_FORCE_CONFIRMED',
    actor_id: user.id,
    metadata: { reason: 'admin_force_confirm', trade_id: tradeId.trim() },
  })

  // Create ledger entry for COVER type
  if (adj.type === 'COVER' && adj.accepter_id) {
    await supabase.from('ledger_entries').insert({
      creditor_id: adj.accepter_id,
      debtor_id: adj.creator_id,
      adjustment_id: adjustmentId,
    })
  }

  revalidatePath('/admin')
  revalidatePath('/admin/adjustments')
  revalidatePath(`/admin/adjustments/${adjustmentId}`)
  revalidatePath('/dashboard')
  revalidatePath('/marketplace')
  revalidatePath('/ledger')

  return { success: true }
}

// ---- Add admin note to adjustment log ----

export async function addAdminNote(adjustmentId: string, note: string) {
  const { supabase, user } = await requireAdmin()

  if (!note.trim()) return { error: 'Note cannot be empty' }

  const { error } = await supabase.from('adjustment_logs').insert({
    adjustment_id: adjustmentId,
    action: 'ADMIN_NOTE',
    actor_id: user.id,
    metadata: { note: note.trim() },
  })

  if (error) return { error: 'Failed to add note' }

  revalidatePath(`/admin/adjustments/${adjustmentId}`)

  return { success: true }
}

// ---- User management: toggle active status ----

export async function toggleUserActive(userId: string) {
  const { supabase, user } = await requireAdmin()

  if (userId === user.id) return { error: 'Cannot deactivate yourself' }

  const { data: target, error: fetchError } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', userId)
    .single()

  if (fetchError || !target) return { error: 'User not found' }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      is_active: !target.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) return { error: 'Failed to update user' }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)

  return { success: true, is_active: !target.is_active }
}

// ---- User management: change role ----

export async function changeUserRole(userId: string, newRole: 'TP' | 'ADMIN') {
  const { supabase, user } = await requireAdmin()

  if (userId === user.id) return { error: 'Cannot change your own role' }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) return { error: 'Failed to change role' }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)

  return { success: true }
}

// ---- User management: trigger password reset ----

export async function triggerPasswordReset(userId: string) {
  const { supabase } = await requireAdmin()

  const { data: target } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!target) return { error: 'User not found' }

  const { error } = await supabase.auth.resetPasswordForEmail(target.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
  })

  if (error) return { error: 'Failed to send password reset email' }

  // Demo mode fallback
  console.log(`[ADMIN] Password reset triggered for ${target.email}`)

  return { success: true, email: target.email }
}

// ---- Fetch activity logs with filters ----

export async function getActivityLogs(filters: {
  adjustmentId?: string
  actorId?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) {
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('adjustment_logs')
    .select('*, actor:profiles!actor_id(name, email), adjustment:adjustments!adjustment_id(date, type, status)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.adjustmentId) {
    query = query.eq('adjustment_id', filters.adjustmentId)
  }
  if (filters.actorId) {
    query = query.eq('actor_id', filters.actorId)
  }
  if (filters.action) {
    query = query.eq('action', filters.action)
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo + 'T23:59:59.999Z')
  }

  const limit = filters.limit || 50
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) return { error: 'Failed to fetch logs', data: null, count: 0 }

  return { data, count: count ?? 0, error: null }
}

// ---- Export logs as CSV data ----

export async function exportLogsCsv(filters: {
  adjustmentId?: string
  actorId?: string
  action?: string
  dateFrom?: string
  dateTo?: string
}) {
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('adjustment_logs')
    .select('*, actor:profiles!actor_id(name, email), adjustment:adjustments!adjustment_id(date, type, status)')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (filters.adjustmentId) query = query.eq('adjustment_id', filters.adjustmentId)
  if (filters.actorId) query = query.eq('actor_id', filters.actorId)
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo + 'T23:59:59.999Z')

  const { data, error } = await query

  if (error || !data) return { error: 'Failed to fetch logs for export', csv: null }

  const header = 'Timestamp,Action,Actor,Actor Email,Adjustment ID,Adj Date,Adj Type,Adj Status,Metadata'
  const rows = data.map((log: any) => {
    const actor = log.actor as any
    const adj = log.adjustment as any
    const meta = JSON.stringify(log.metadata || {}).replace(/"/g, '""')
    return [
      new Date(log.created_at).toISOString(),
      log.action,
      actor?.name || '',
      actor?.email || '',
      log.adjustment_id,
      adj?.date || '',
      adj?.type || '',
      adj?.status || '',
      `"${meta}"`,
    ].join(',')
  })

  return { csv: [header, ...rows].join('\n'), error: null }
}

// ---- Bid Period actions ----

export async function getBidPeriods() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('bid_periods')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) return { data: null, error: 'Failed to fetch bid periods' }
  return { data, error: null }
}

export async function createBidPeriod(name: string, startDate: string, endDate: string) {
  const { supabase } = await requireAdmin()

  if (!name.trim()) return { error: 'Name is required' }
  if (!startDate || !endDate) return { error: 'Start and end dates are required' }
  if (endDate < startDate) return { error: 'End date must be on or after start date' }

  const { error } = await supabase
    .from('bid_periods')
    .insert({ name: name.trim(), start_date: startDate, end_date: endDate, is_active: false })

  if (error) return { error: 'Failed to create bid period' }

  revalidatePath('/admin/bid-periods')
  return { success: true }
}

export async function setActiveBidPeriod(id: string) {
  const { supabase } = await requireAdmin()

  // Deactivate all, then activate the chosen one (two-step to avoid race)
  await supabase.from('bid_periods').update({ is_active: false }).neq('id', id)
  const { error } = await supabase.from('bid_periods').update({ is_active: true }).eq('id', id)

  if (error) return { error: 'Failed to set active bid period' }

  revalidatePath('/admin/bid-periods')
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deactivateBidPeriod(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('bid_periods').update({ is_active: false }).eq('id', id)
  if (error) return { error: 'Failed to deactivate bid period' }
  revalidatePath('/admin/bid-periods')
  revalidatePath('/calendar')
  return { success: true }
}

export async function deleteBidPeriod(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('bid_periods').delete().eq('id', id).eq('is_active', false)
  if (error) return { error: 'Cannot delete bid period (may be active or not found)' }
  revalidatePath('/admin/bid-periods')
  return { success: true }
}

// ---- Public: get active bid period (no admin check — used by calendar/footer) ----

export async function getActiveBidPeriod() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('bid_periods')
    .select('*')
    .eq('is_active', true)
    .single()
  return data ?? null
}

// ---- Dashboard stats ----

export async function getAdminDashboardStats() {
  const { supabase } = await requireAdmin()

  // Get current week bounds (Monday-Sunday)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const weekStart = monday.toISOString()
  const weekEnd = sunday.toISOString()

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: openListings },
    { count: pendingCount },
    { count: confirmedCount },
    { count: expiredCount },
    { count: confirmedThisWeek },
    { count: expiredThisWeek },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('adjustments').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
    supabase.from('adjustments').select('*', { count: 'exact', head: true }).eq('status', 'PENDING_CONFIRMATION'),
    supabase.from('adjustments').select('*', { count: 'exact', head: true }).eq('status', 'CONFIRMED'),
    supabase.from('adjustments').select('*', { count: 'exact', head: true }).eq('status', 'EXPIRED'),
    supabase.from('adjustments').select('*', { count: 'exact', head: true })
      .eq('status', 'CONFIRMED')
      .gte('confirmed_at', weekStart)
      .lte('confirmed_at', weekEnd),
    supabase.from('adjustments').select('*', { count: 'exact', head: true })
      .eq('status', 'EXPIRED')
      .gte('updated_at', weekStart)
      .lte('updated_at', weekEnd),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    inactiveUsers: (totalUsers ?? 0) - (activeUsers ?? 0),
    openListings: openListings ?? 0,
    pendingCount: pendingCount ?? 0,
    confirmedCount: confirmedCount ?? 0,
    expiredCount: expiredCount ?? 0,
    confirmedThisWeek: confirmedThisWeek ?? 0,
    expiredThisWeek: expiredThisWeek ?? 0,
  }
}
