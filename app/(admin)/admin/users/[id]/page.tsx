import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUserDetail } from '@/components/admin/admin-user-detail'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!user) redirect('/admin/users')

  // Get schedule
  const { data: schedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', id)
    .order('day_of_week')

  // Get adjustment history
  const { data: adjustments } = await supabase
    .from('adjustments')
    .select('*, creator:profiles!creator_id(name), accepter:profiles!accepter_id(name)')
    .or(`creator_id.eq.${id},accepter_id.eq.${id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get ledger balance
  const { data: creditorEntries } = await supabase
    .from('ledger_entries')
    .select('id')
    .eq('creditor_id', id)
    .eq('is_settled', false)

  const { data: debtorEntries } = await supabase
    .from('ledger_entries')
    .select('id')
    .eq('debtor_id', id)
    .eq('is_settled', false)

  const ledgerBalance = {
    owed: creditorEntries?.length ?? 0,
    owes: debtorEntries?.length ?? 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <a href="/admin/users" className="hover:text-gray-700">Users</a>
        <span>/</span>
        <span className="text-gray-900">{user.name}</span>
      </div>

      <AdminUserDetail
        user={user}
        schedule={schedule ?? []}
        adjustments={adjustments ?? []}
        ledgerBalance={ledgerBalance}
      />
    </div>
  )
}
