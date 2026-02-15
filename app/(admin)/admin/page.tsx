import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: openListings } = await supabase
    .from('adjustments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'OPEN')

  const { count: pendingCount } = await supabase
    .from('adjustments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING_CONFIRMATION')

  const { count: confirmedCount } = await supabase
    .from('adjustments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'CONFIRMED')

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers ?? 0, color: 'text-blue-600' },
          { label: 'Open Listings', value: openListings ?? 0, color: 'text-green-600' },
          { label: 'Pending Confirmation', value: pendingCount ?? 0, color: 'text-amber-600' },
          { label: 'Confirmed', value: confirmedCount ?? 0, color: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border p-4">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <a href="/admin/users" className="bg-white rounded-lg border p-4 hover:border-blue-300 transition-colors">
          <p className="font-semibold text-gray-900">User Management</p>
          <p className="text-sm text-gray-500 mt-1">View, deactivate, or change user roles</p>
        </a>
        <a href="/admin/adjustments" className="bg-white rounded-lg border p-4 hover:border-blue-300 transition-colors">
          <p className="font-semibold text-gray-900">Adjustment Management</p>
          <p className="text-sm text-gray-500 mt-1">View all adjustments, force expire/confirm</p>
        </a>
      </div>
    </div>
  )
}
