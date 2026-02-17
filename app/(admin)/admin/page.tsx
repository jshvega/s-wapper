import { getAdminDashboardStats } from '@/lib/actions/admin'
import { ExpireNowButton } from '@/components/shared/expire-now-button'
import { Users, FileText, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react'

export default async function AdminDashboard() {
  const stats = await getAdminDashboardStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <ExpireNowButton />
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Active"
            value={stats.activeUsers}
            color="green"
          />
          <StatCard
            icon={XCircle}
            label="Inactive"
            value={stats.inactiveUsers}
            color="red"
          />
        </div>
      </div>

      {/* Listing Stats */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Listings by Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Open"
            value={stats.openListings}
            color="blue"
          />
          <StatCard
            icon={Clock}
            label="Pending Confirmation"
            value={stats.pendingCount}
            color="amber"
          />
          <StatCard
            icon={CheckCircle}
            label="Confirmed"
            value={stats.confirmedCount}
            color="green"
          />
          <StatCard
            icon={XCircle}
            label="Expired"
            value={stats.expiredCount}
            color="red"
          />
        </div>
      </div>

      {/* This Week */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">This Week</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Confirmations"
            value={stats.confirmedThisWeek}
            color="green"
          />
          <StatCard
            icon={TrendingDown}
            label="Expirations"
            value={stats.expiredThisWeek}
            color="red"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/admin/users" className="bg-white rounded-lg border p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">View, deactivate, or change roles</p>
              </div>
            </div>
          </a>
          <a href="/admin/adjustments" className="bg-white rounded-lg border p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-gray-900">Adjustments</p>
                <p className="text-sm text-gray-500">View all, force expire/confirm</p>
              </div>
            </div>
          </a>
          <a href="/admin/logs" className="bg-white rounded-lg border p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-semibold text-gray-900">Activity Logs</p>
                <p className="text-sm text-gray-500">Full audit trail with export</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple'
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
  }

  const c = colorMap[color]

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}
