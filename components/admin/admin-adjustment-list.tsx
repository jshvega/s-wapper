'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-cyan-100 text-cyan-700',
  PENDING_CONFIRMATION: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  REMOVED: 'bg-gray-100 text-gray-500',
}

const ALL_STATUSES = ['DRAFT', 'OPEN', 'PENDING_CONFIRMATION', 'CONFIRMED', 'EXPIRED', 'REMOVED']

export function AdminAdjustmentList({
  adjustments,
  users,
}: {
  adjustments: any[]
  users: { id: string; name: string }[]
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  const filtered = adjustments.filter((adj) => {
    if (statusFilter !== 'all' && adj.status !== statusFilter) return false
    if (userFilter !== 'all' && adj.creator_id !== userFilter && adj.accepter_id !== userFilter) return false
    if (dateFrom && adj.date < dateFrom) return false
    if (dateTo && adj.date > dateTo) return false
    if (search) {
      const s = search.toLowerCase()
      const creatorName = (adj.creator as any)?.name?.toLowerCase() || ''
      const accepterName = (adj.accepter as any)?.name?.toLowerCase() || ''
      const trackId = adj.aspect_track_id?.toLowerCase() || ''
      if (!creatorName.includes(s) && !accepterName.includes(s) && !trackId.includes(s)) {
        return false
      }
    }
    return true
  })

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or Track ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="To"
        />
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} adjustment{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Creator</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Accepter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Track ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(adj.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium">
                      {adj.type} / {adj.listing_type}
                    </span>
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
                  <td className="px-4 py-3 text-gray-600">
                    {(adj.creator as any)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(adj.accepter as any)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {adj.aspect_track_id ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(adj.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/adjustments/${adj.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">No adjustments match your filters.</p>
        )}
      </div>
    </>
  )
}
