import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryList } from '@/components/history/history-list'
import { LegacyEntryForm } from '@/components/history/legacy-entry-form'
import { Badge } from '@/components/ui/badge'
import type { PendingDebt } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [adjustmentsRes, usersRes, pendingDebtsRes] = await Promise.all([
    supabase
      .from('adjustments')
      .select('*, creator:profiles!creator_id(id, name), accepter:profiles!accepter_id(id, name)')
      .or(`creator_id.eq.${user.id},accepter_id.eq.${user.id}`)
      .order('date', { ascending: false })
      .limit(200),
    supabase
      .from('profiles')
      .select('id, name, email')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('pending_debts')
      .select('*')
      .eq('creator_id', user.id)
      .is('linked_adjustment_id', null)
      .order('date', { ascending: false }),
  ])

  const pendingDebts = (pendingDebtsRes.data ?? []) as PendingDebt[]

  return (
    <div className="p-4 lg:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">History</h1>
        <p className="text-sm text-gray-500">All your past and current adjustments.</p>
      </div>

      <HistoryList adjustments={adjustmentsRes.data ?? []} currentUserId={user.id} />

      {/* Pending debts for unregistered users */}
      {pendingDebts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            Pending Debts (Unregistered TPs)
            <Badge variant="warning">{pendingDebts.length}</Badge>
          </h2>
          <div className="space-y-2">
            {pendingDebts.map((debt) => (
              <div
                key={debt.id}
                className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-amber-900">
                      {debt.type} with {debt.other_party_name}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {new Date(debt.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' · '}
                      {debt.role === 'CREDITOR' ? 'Owed to you' : 'You owe'}
                    </p>
                    {debt.notes && (
                      <p className="text-xs text-amber-600 mt-0.5 italic">{debt.notes}</p>
                    )}
                  </div>
                  <Badge variant="warning" className="text-[10px]">Pending link</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy entry form */}
      <LegacyEntryForm
        allUsers={usersRes.data ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}
