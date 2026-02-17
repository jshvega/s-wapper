'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleUserActive, changeUserRole, triggerPasswordReset } from '@/lib/actions/admin'
import type { Profile, Schedule, Adjustment } from '@/lib/types'

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-cyan-100 text-cyan-700',
  PENDING_CONFIRMATION: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  REMOVED: 'bg-gray-100 text-gray-500',
}

export function AdminUserDetail({
  user,
  schedule,
  adjustments,
  ledgerBalance,
}: {
  user: Profile
  schedule: Schedule[]
  adjustments: any[]
  ledgerBalance: { owed: number; owes: number }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setLoading(action)
    setMessage(null)
    try {
      const result = await fn()
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `${action} successful` })
        router.refresh()
      }
    } catch {
      setMessage({ type: 'error', text: 'Action failed' })
    } finally {
      setLoading(null)
    }
  }

  const sortedSchedule = [...schedule].sort(
    (a, b) => DAY_ORDER.indexOf(a.day_of_week as any) - DAY_ORDER.indexOf(b.day_of_week as any)
  )

  return (
    <div className="space-y-6">
      {/* Feedback message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Profile</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{user.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {user.role}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Ledger Balance */}
          <div className="pt-3 border-t">
            <h3 className="text-xs text-gray-500 mb-2">Ledger Balance</h3>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-green-600 font-semibold">{ledgerBalance.owed}</span>{' '}
                <span className="text-gray-500">owed to them</span>
              </div>
              <div>
                <span className="text-red-600 font-semibold">{ledgerBalance.owes}</span>{' '}
                <span className="text-gray-500">they owe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Schedule</h2>
          {sortedSchedule.length === 0 ? (
            <p className="text-sm text-gray-500">No schedule set up</p>
          ) : (
            <div className="space-y-2">
              {sortedSchedule.map((day) => (
                <div
                  key={day.day_of_week}
                  className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                    day.is_day_off ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-900">{day.day_of_week}</span>
                  {day.is_day_off ? (
                    <span className="text-blue-600 text-xs font-medium">Day Off</span>
                  ) : (
                    <span className="text-gray-600">
                      {day.shift_start?.slice(0, 5)} – {day.shift_end?.slice(0, 5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() =>
                handleAction(
                  user.is_active ? 'Deactivate' : 'Reactivate',
                  () => toggleUserActive(user.id)
                )
              }
              disabled={loading !== null}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                user.is_active
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              {loading === 'Deactivate' || loading === 'Reactivate'
                ? 'Processing...'
                : user.is_active
                  ? 'Deactivate User'
                  : 'Reactivate User'}
            </button>

            <button
              onClick={() =>
                handleAction('Role change', () =>
                  changeUserRole(user.id, user.role === 'ADMIN' ? 'TP' : 'ADMIN')
                )
              }
              disabled={loading !== null}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors disabled:opacity-50"
            >
              {loading === 'Role change'
                ? 'Processing...'
                : `Change Role to ${user.role === 'ADMIN' ? 'TP' : 'ADMIN'}`}
            </button>

            <button
              onClick={() =>
                handleAction('Password reset', () => triggerPasswordReset(user.id))
              }
              disabled={loading !== null}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
            >
              {loading === 'Password reset' ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </div>
        </div>
      </div>

      {/* Adjustment History */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Recent Adjustments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Partner</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Track ID</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {adjustments.map((adj: any) => (
                <tr key={adj.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(adj.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">
                    {adj.type} / {adj.listing_type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColors[adj.status] || ''
                      }`}
                    >
                      {adj.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {adj.creator_id === user.id ? 'Creator' : 'Accepter'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {adj.creator_id === user.id
                      ? adj.accepter?.name ?? '—'
                      : adj.creator?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {adj.aspect_track_id ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {adjustments.length === 0 && (
          <p className="text-center text-gray-500 py-8">No adjustments found.</p>
        )}
      </div>
    </div>
  )
}
