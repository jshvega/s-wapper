'use client'

import { useState, useEffect, useCallback } from 'react'
import { getActivityLogs, exportLogsCsv } from '@/lib/actions/admin'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'

const ALL_ACTIONS = [
  'CREATED',
  'PUBLISHED',
  'ACCEPTED',
  'CONFIRMED',
  'EXPIRED',
  'REMOVED',
  'ADMIN_FORCE_EXPIRED',
  'ADMIN_FORCE_CONFIRMED',
  'ADMIN_NOTE',
]

const actionLabels: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Created', color: 'text-gray-600' },
  PUBLISHED: { label: 'Published', color: 'text-blue-600' },
  ACCEPTED: { label: 'Accepted', color: 'text-cyan-600' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-600' },
  EXPIRED: { label: 'Expired', color: 'text-red-600' },
  REMOVED: { label: 'Removed', color: 'text-gray-500' },
  ADMIN_FORCE_EXPIRED: { label: 'Force Expired', color: 'text-red-700' },
  ADMIN_FORCE_CONFIRMED: { label: 'Force Confirmed', color: 'text-green-700' },
  ADMIN_NOTE: { label: 'Admin Note', color: 'text-purple-600' },
}

const PAGE_SIZE = 50

export function AdminActivityLogs({
  users,
}: {
  users: { id: string; name: string }[]
}) {
  const [logs, setLogs] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [actionFilter, setActionFilter] = useState('')
  const [actorFilter, setActorFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filters = {
    action: actionFilter || undefined,
    actorId: actorFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const result = await getActivityLogs({
      ...filters,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })
    if (!result.error && result.data) {
      setLogs(result.data)
      setTotalCount(result.count)
    }
    setLoading(false)
  }, [actionFilter, actorFilter, dateFrom, dateTo, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [actionFilter, actorFilter, dateFrom, dateTo])

  const handleExport = async () => {
    setExporting(true)
    const result = await exportLogsCsv(filters)
    if (result.csv) {
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {actionLabels[a]?.label || a}
            </option>
          ))}
        </select>
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actors</option>
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
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        {totalCount} log{totalCount !== 1 ? 's' : ''} found
      </p>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actor</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Adjustment</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log: any) => {
                    const info = actionLabels[log.action] || {
                      label: log.action,
                      color: 'text-gray-600',
                    }
                    const adj = log.adjustment as any
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${info.color}`}>
                            {info.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {(log.actor as any)?.name || 'System'}
                        </td>
                        <td className="px-4 py-3">
                          {adj ? (
                            <a
                              href={`/admin/adjustments/${log.adjustment_id}`}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              {adj.type} {adj.date} ({adj.status})
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 font-mono">
                              {log.adjustment_id?.slice(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.action === 'ADMIN_NOTE' && log.metadata?.note ? (
                            <span className="text-xs text-purple-600">
                              &quot;{(log.metadata.note as string).slice(0, 50)}
                              {(log.metadata.note as string).length > 50 ? '...' : ''}&quot;
                            </span>
                          ) : log.metadata &&
                            Object.keys(log.metadata).length > 0 ? (
                            <span className="text-xs text-gray-400 font-mono">
                              {JSON.stringify(log.metadata).slice(0, 60)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {logs.length === 0 && (
              <p className="text-center text-gray-500 py-8">No logs match your filters.</p>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
