import { createClient } from '@/lib/supabase/server'
import { AdminAdjustmentList } from '@/components/admin/admin-adjustment-list'

export default async function AdminAdjustmentsPage() {
  const supabase = await createClient()

  const { data: adjustments } = await supabase
    .from('adjustments')
    .select('*, creator:profiles!creator_id(name), accepter:profiles!accepter_id(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  // Get all users for the user filter dropdown
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name')
    .order('name')

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Adjustment Management</h1>
      <AdminAdjustmentList adjustments={adjustments ?? []} users={users ?? []} />
    </div>
  )
}
