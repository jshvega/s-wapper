import { createClient } from '@/lib/supabase/server'
import { AdminActivityLogs } from '@/components/admin/admin-activity-logs'

export default async function AdminLogsPage() {
  const supabase = await createClient()

  // Get all users for filter dropdown
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name')
    .order('name')

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
      <AdminActivityLogs users={users ?? []} />
    </div>
  )
}
