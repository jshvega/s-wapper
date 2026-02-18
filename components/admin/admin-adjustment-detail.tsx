'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { forceExpireAdjustment, forceConfirmAdjustment, addAdminNote } from '@/lib/actions/admin'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-cyan-100 text-cyan-700',
  PENDING_CONFIRMATION: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  REMOVED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-700',
}

const actionLabels: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Created', color: 'text-gray-600' },
  PUBLISHED: { label: 'Published', color: 'text-blue-600' },
  ACCEPTED: { label: 'Accepted', color: 'text-cyan-600' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-600' },
  EXPIRED: { label: 'Expired', color: 'text-red-600' },
  REMOVED: { label: 'Removed', color: 'text-gray-500' },
  ADMIN_FORCE_EXPIRED: { label: 'Force Expired (Admin)', color: 'text-red-700' },
  ADMIN_FORCE_CONFIRMED: { label: 'Force Confirmed (Admin)', color: 'text-green-700' },
  ADMIN_NOTE: { label: 'Admin Note', color: 'text-purple-600' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600' },
}

export function AdminAdjustmentDetail({
  adjustment,
  logs,
}: {
  adjustment: any
  logs: any[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tradeId, setTradeId] = useState('')
  const [note, setNote] = useState('')

  const isPending = adjustment.status === 'PENDING_CONFIRMATION'

  const handleForceExpire = async () => {
    if (!confirm('Are you sure you want to force expire this adjustment?')) return
    setLoading('expire')
    setMessage(null)
    const result = await forceExpireAdjustment(adjustment.id)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Adjustment force expired' })
      router.refresh()
    }
    setLoading(null)
  }

  const handleForceConfirm = async () => {
    if (!tradeId.trim()) {
      setMessage({ type: 'error', text: 'Trade ID is required' })
      return
    }
    if (!confirm('Are you sure you want to force confirm this adjustment?')) return
    setLoading('confirm')
    setMessage(null)
    const result = await forceConfirmAdjustment(adjustment.id, tradeId)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Adjustment force confirmed' })
      setTradeId('')
      router.refresh()
    }
    setLoading(null)
  }

  const handleAddNote = async () => {
    if (!note.trim()) return
    setLoading('note')
    setMessage(null)
    const result = await addAdminNote(adjustment.id, note)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Note added' })
      setNote('')
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
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
        {/* Adjustment Details */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Adjustment Details</h2>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                statusColors[adjustment.status] || ''
              }`}
            >
              {adjustment.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="font-medium text-gray-900">{adjustment.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Listing Type</p>
              <p className="font-medium text-gray-900">{adjustment.listing_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium text-gray-900">
                {new Date(adjustment.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Original Shift</p>
              <p className="font-medium text-gray-900">
                {adjustment.original_shift_start?.slice(0, 5)} –{' '}
                {adjustment.original_shift_end?.slice(0, 5)}
              </p>
            </div>
            {adjustment.desired_shift_start && (
              <div>
                <p className="text-xs text-gray-500">Desired Shift</p>
                <p className="font-medium text-gray-900">
                  {adjustment.desired_shift_start?.slice(0, 5)} –{' '}
                  {adjustment.desired_shift_end?.slice(0, 5)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Trade ID</p>
              <p className="font-mono text-gray-900">
                {adjustment.aspect_trade_id ?? '—'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Creator</p>
              <Link
                href={`/admin/users/${adjustment.creator_id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {adjustment.creator?.name ?? '—'}
              </Link>
            </div>
            <div>
              <p className="text-xs text-gray-500">Accepter</p>
              {adjustment.accepter_id ? (
                <Link
                  href={`/admin/users/${adjustment.accepter_id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {adjustment.accepter?.name ?? '—'}
                </Link>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-gray-900">
                {new Date(adjustment.created_at).toLocaleString()}
              </p>
            </div>
            {adjustment.accepted_at && (
              <div>
                <p className="text-xs text-gray-500">Accepted</p>
                <p className="text-gray-900">
                  {new Date(adjustment.accepted_at).toLocaleString()}
                </p>
              </div>
            )}
            {adjustment.confirmed_at && (
              <div>
                <p className="text-xs text-gray-500">Confirmed</p>
                <p className="text-gray-900">
                  {new Date(adjustment.confirmed_at).toLocaleString()}
                </p>
              </div>
            )}
            {adjustment.expires_at && (
              <div>
                <p className="text-xs text-gray-500">Expires</p>
                <p className={`${
                  new Date(adjustment.expires_at) < new Date() ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {new Date(adjustment.expires_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {adjustment.notes && (
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{adjustment.notes}</p>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div className="space-y-4">
          {isPending && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Admin Actions</h2>

              {/* Force Expire */}
              <button
                onClick={handleForceExpire}
                disabled={loading !== null}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
              >
                {loading === 'expire' ? 'Expiring...' : 'Force Expire'}
              </button>

              {/* Force Confirm */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter Trade ID..."
                  value={tradeId}
                  onChange={(e) => setTradeId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleForceConfirm}
                  disabled={loading !== null || !tradeId.trim()}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
                >
                  {loading === 'confirm' ? 'Confirming...' : 'Force Confirm'}
                </button>
              </div>
            </div>
          )}

          {/* Add Note */}
          <div className="bg-white rounded-lg border p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Add Admin Note</h2>
            <textarea
              placeholder="Write a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={loading !== null || !note.trim()}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors disabled:opacity-50"
            >
              {loading === 'note' ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </div>
      </div>

      {/* Log History */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Activity Log</h2>
        </div>
        <div className="divide-y">
          {logs.map((log: any) => {
            const info = actionLabels[log.action] || {
              label: log.action,
              color: 'text-gray-600',
            }
            return (
              <div key={log.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${info.color}`}>
                      {info.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      by {(log.actor as any)?.name || 'System'}
                    </span>
                  </div>
                  {log.action === 'ADMIN_NOTE' && log.metadata?.note && (
                    <p className="text-sm text-gray-600 mt-1 bg-purple-50 px-3 py-2 rounded">
                      {log.metadata.note as string}
                    </p>
                  )}
                  {log.metadata &&
                    Object.keys(log.metadata).length > 0 &&
                    log.action !== 'ADMIN_NOTE' && (
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
        {logs.length === 0 && (
          <p className="text-center text-gray-500 py-8">No activity logs found.</p>
        )}
      </div>
    </div>
  )
}
