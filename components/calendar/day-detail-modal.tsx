'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { EffectiveShift, Adjustment } from '@/lib/types'
import { formatTime, formatDisplayDate } from '@/lib/utils/dates'
import { confirmAdjustment } from '@/lib/actions/listings'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DayDetailModalProps {
  date: Date | null
  shift: EffectiveShift | undefined
  onClose: () => void
  currentUserId: string
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  PENDING_CONFIRMATION: 'Pending',
  CONFIRMED: 'Confirmed',
  EXPIRED: 'Expired',
  REMOVED: 'Removed',
}

const STATUS_BADGE: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary' | 'outline'> = {
  DRAFT: 'secondary',
  OPEN: 'default',
  PENDING_CONFIRMATION: 'warning',
  CONFIRMED: 'success',
  EXPIRED: 'destructive',
  REMOVED: 'outline',
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const diffMs = new Date(expiresAt).getTime() - now
  if (diffMs <= 0) return <span className="text-red-500 text-xs font-medium">Expired</span>

  const hours = Math.floor(diffMs / 3600000)
  const mins = Math.floor((diffMs % 3600000) / 60000)

  return (
    <span className={cn('text-xs font-medium', hours < 4 ? 'text-red-500' : 'text-amber-600')}>
      ⏱ {hours}h {mins}m remaining
    </span>
  )
}

function TrackIdForm({
  adjustmentId,
  onSuccess,
}: {
  adjustmentId: string
  onSuccess: () => void
}) {
  const [trackId, setTrackId] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trackId.trim()) return

    setLoading(true)
    const result = await confirmAdjustment(adjustmentId, trackId.trim())
    setLoading(false)

    if (result?.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Confirmed!', description: 'Adjustment confirmed with Track ID.' })
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <Input
        value={trackId}
        onChange={(e) => setTrackId(e.target.value)}
        placeholder="Aspect Track ID"
        className="h-8 text-sm flex-1"
      />
      <Button type="submit" size="sm" disabled={loading || !trackId.trim()} className="h-8">
        {loading ? '...' : 'Confirm'}
      </Button>
    </form>
  )
}

function AdjustmentCard({
  adj,
  currentUserId,
  onConfirmed,
}: {
  adj: Adjustment
  currentUserId: string
  onConfirmed: () => void
}) {
  const isCreator = adj.creator_id === currentUserId
  const canConfirm =
    adj.status === 'PENDING_CONFIRMATION' &&
    (adj.creator_id === currentUserId || adj.accepter_id === currentUserId)

  return (
    <div
      className={cn(
        'rounded-lg border p-3 space-y-2',
        adj.status === 'PENDING_CONFIRMATION' && 'border-amber-200 bg-amber-50',
        adj.status === 'CONFIRMED' && 'border-green-200 bg-green-50',
        adj.status === 'DRAFT' && 'border-dashed border-gray-300 bg-gray-50',
        adj.status === 'OPEN' && 'border-blue-200 bg-blue-50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge variant={STATUS_BADGE[adj.status] || 'default'} className="text-[10px] shrink-0">
            {STATUS_LABELS[adj.status]}
          </Badge>
          <span className="text-xs font-medium text-gray-700 truncate">
            {adj.type} · {adj.listing_type}
          </span>
        </div>
        {!isCreator && adj.status === 'CONFIRMED' && (
          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
        )}
      </div>

      {/* Shift times */}
      <div className="text-xs text-gray-600">
        <span className="font-medium">{formatTime(adj.original_shift_start)}</span>
        <span className="text-gray-400"> – </span>
        <span className="font-medium">{formatTime(adj.original_shift_end)}</span>
        {adj.desired_shift_start && (
          <span className="text-indigo-600">
            {' '}→ {formatTime(adj.desired_shift_start)} – {formatTime(adj.desired_shift_end)}
          </span>
        )}
      </div>

      {/* Parties */}
      <div className="text-xs text-gray-500 space-y-0.5">
        <p>
          <span className="font-medium">Creator:</span>{' '}
          {(adj.creator as any)?.name ?? 'You'}
          {isCreator && ' (you)'}
        </p>
        {adj.accepter_id && (
          <p>
            <span className="font-medium">Accepter:</span>{' '}
            {(adj.accepter as any)?.name ?? '—'}
            {adj.accepter_id === currentUserId && ' (you)'}
          </p>
        )}
      </div>

      {/* Track ID */}
      {adj.aspect_track_id && (
        <p className="text-xs font-mono text-green-700 bg-green-100 px-2 py-0.5 rounded">
          Track ID: {adj.aspect_track_id}
        </p>
      )}

      {/* Notes */}
      {adj.notes && (
        <p className="text-xs text-gray-500 italic">"{adj.notes}"</p>
      )}

      {/* Countdown + Track ID entry */}
      {adj.status === 'PENDING_CONFIRMATION' && adj.expires_at && (
        <div className="space-y-1.5">
          <CountdownTimer expiresAt={adj.expires_at} />
          {canConfirm && (
            <TrackIdForm adjustmentId={adj.id} onSuccess={onConfirmed} />
          )}
        </div>
      )}
    </div>
  )
}

export function DayDetailModal({
  date,
  shift,
  onClose,
  currentUserId,
}: DayDetailModalProps) {
  const router = useRouter()

  function handleConfirmed() {
    onClose()
    router.refresh()
  }

  if (!date) return null

  const effective = shift?.effectiveShift
  const adjustments = shift?.adjustments ?? []
  const isDayOff = shift?.isDayOff && !effective

  // Format the date for new listing link
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`

  return (
    <Dialog open={!!date} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{formatDisplayDate(date)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Effective shift summary */}
          <div
            className={cn(
              'rounded-lg p-3',
              isDayOff && 'bg-blue-50 border border-blue-100',
              effective?.type === 'COVERED' && 'bg-teal-50 border border-teal-100',
              effective?.type === 'COVERING' && 'bg-purple-50 border border-purple-100',
              effective?.type === 'SWAPPED' && 'bg-indigo-50 border border-indigo-100',
              effective?.type === 'BASE' && 'bg-gray-50 border border-gray-100',
            )}
          >
            <p className="text-xs font-medium text-gray-500 mb-1">Effective schedule</p>
            {isDayOff ? (
              <p className="text-sm font-semibold text-blue-700">Day Off</p>
            ) : effective?.type === 'COVERED' ? (
              <div>
                <p className="text-sm font-semibold text-teal-700">Being Covered</p>
                {effective.relatedUser && (
                  <p className="text-xs text-teal-600 mt-0.5">
                    by {(effective.relatedUser as any).name}
                  </p>
                )}
              </div>
            ) : effective?.type === 'COVERING' ? (
              <div>
                <p className="text-sm font-semibold text-purple-700">
                  Covering {effective.relatedUser ? (effective.relatedUser as any).name : 'someone'}
                </p>
                <p className="text-xs text-purple-600 mt-0.5">
                  {formatTime(effective.start)} – {formatTime(effective.end)}
                </p>
              </div>
            ) : effective ? (
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatTime(effective.start)} – {formatTime(effective.end)}
                </p>
                {effective.type === 'SWAPPED' && (
                  <p className="text-xs text-indigo-600 mt-0.5">
                    ↔ Swapped with {effective.relatedUser ? (effective.relatedUser as any).name : 'someone'}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No schedule set</p>
            )}
          </div>

          {/* Adjustments */}
          {adjustments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Adjustments ({adjustments.length})
              </p>
              {adjustments.map((adj) => (
                <AdjustmentCard
                  key={adj.id}
                  adj={adj}
                  currentUserId={currentUserId}
                  onConfirmed={handleConfirmed}
                />
              ))}
            </div>
          )}

          <Separator />

          {/* Quick action */}
          <div className="flex gap-2">
            <Link href={`/listings/new?date=${dateStr}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Create Listing
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
