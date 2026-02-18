'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatTime } from '@/lib/utils/dates'
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Shield,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Adjustment, AdjustmentStatus, AdjustmentType } from '@/lib/types'

const STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'destructive' | 'warning' | 'secondary' | 'info'; label: string; icon: React.ElementType }
> = {
  CONFIRMED:            { variant: 'success',     label: 'Confirmed',  icon: CheckCircle2 },
  PENDING_CONFIRMATION: { variant: 'warning',     label: 'Pending',    icon: Clock },
  EXPIRED:              { variant: 'destructive',  label: 'Expired',    icon: XCircle },
  REMOVED:              { variant: 'secondary',    label: 'Removed',    icon: XCircle },
  CANCELLED:            { variant: 'destructive',  label: 'Cancelled',  icon: XCircle },
  OPEN:                 { variant: 'info',         label: 'Open',       icon: Clock },
  DRAFT:                { variant: 'secondary',    label: 'Draft',      icon: Clock },
}

interface HistoryListProps {
  adjustments: Adjustment[]
  currentUserId: string
}

export function HistoryList({ adjustments, currentUserId }: HistoryListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return adjustments.filter((adj) => {
      if (statusFilter !== 'ALL' && adj.status !== statusFilter) return false
      if (typeFilter !== 'ALL' && adj.type !== typeFilter) return false
      if (dateFrom && adj.date < dateFrom) return false
      if (dateTo && adj.date > dateTo) return false
      return true
    })
  }, [adjustments, statusFilter, typeFilter, dateFrom, dateTo])

  const hasActiveFilters = statusFilter !== 'ALL' || typeFilter !== 'ALL' || dateFrom || dateTo

  return (
    <div className="space-y-4">
      {/* Filter toggle */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setShowFilters((v) => !v)}
      >
        <Filter className="h-3.5 w-3.5" />
        Filters
        {hasActiveFilters && (
          <Badge variant="info" className="ml-1 text-[10px] px-1.5 py-0">
            Active
          </Badge>
        )}
        {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PENDING_CONFIRMATION">Pending</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="REMOVED">Removed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="SWAP">Swap</SelectItem>
                    <SelectItem value="COVER">Cover</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => {
                  setStatusFilter('ALL')
                  setTypeFilter('ALL')
                  setDateFrom('')
                  setDateTo('')
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <p className="text-xs text-gray-500">
        {filtered.length} adjustment{filtered.length !== 1 ? 's' : ''}
        {hasActiveFilters ? ' (filtered)' : ''}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {adjustments.length === 0
              ? 'No adjustments yet. Create a listing to get started!'
              : 'No adjustments match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((adj) => (
            <HistoryRow key={adj.id} adj={adj} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryRow({ adj, currentUserId }: { adj: Adjustment; currentUserId: string }) {
  const config = STATUS_CONFIG[adj.status] ?? { variant: 'secondary' as const, label: adj.status, icon: Clock }
  const StatusIcon = config.icon

  const isCancelled = adj.status === 'CANCELLED'
  const isExpired = adj.status === 'EXPIRED'
  const isStrikethrough = isCancelled || isExpired

  const otherParty = adj.creator_id === currentUserId
    ? adj.accepter
    : adj.creator

  const roleLabel = adj.creator_id === currentUserId ? 'Created by you' : 'You accepted'

  const dateDisplay = new Date(adj.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link href={`/listings/${adj.id}`}>
      <Card className={`hover:bg-gray-50 transition-colors ${isCancelled ? 'border-red-200' : ''}`}>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Top row: badges */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <Badge variant={config.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  {adj.type === 'SWAP' ? (
                    <ArrowRightLeft className="h-3 w-3" />
                  ) : (
                    <Shield className="h-3 w-3" />
                  )}
                  {adj.type}
                </Badge>
              </div>

              {/* Date + shift */}
              <p className={`text-sm font-medium ${isStrikethrough ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {dateDisplay}
              </p>
              <p className={`text-xs mt-0.5 ${isStrikethrough ? 'line-through text-gray-300' : 'text-gray-500'}`}>
                {formatTime(adj.original_shift_start)} – {formatTime(adj.original_shift_end)}
              </p>

              {/* Other party */}
              <p className="text-xs text-gray-500 mt-1">
                <span className="text-gray-400">{roleLabel}</span>
                {otherParty && (
                  <> · <span className="font-medium text-gray-700">{(otherParty as any).name}</span></>
                )}
              </p>

              {/* Trade ID */}
              {adj.aspect_trade_id && (
                <p className="text-xs text-green-700 mt-0.5">
                  Trade ID: {adj.aspect_trade_id}
                </p>
              )}
            </div>

            <ExternalLink className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
