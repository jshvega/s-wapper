'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { publishListing, deleteListing } from '@/lib/actions/listings'
import { formatTime } from '@/lib/utils/dates'
import { useToast } from '@/hooks/use-toast'
import { Clock, Trash2, Send, ExternalLink } from 'lucide-react'
import type { Adjustment } from '@/lib/types'

const STATUS_BADGE: Record<string, { variant: 'default' | 'secondary' | 'warning' | 'success' | 'destructive' | 'info'; label: string }> = {
  DRAFT:                { variant: 'secondary', label: 'Draft' },
  OPEN:                 { variant: 'info',      label: 'Open' },
  PENDING_CONFIRMATION: { variant: 'warning',   label: 'Pending' },
  CONFIRMED:            { variant: 'success',   label: 'Confirmed' },
  EXPIRED:              { variant: 'destructive', label: 'Expired' },
  REMOVED:              { variant: 'secondary', label: 'Removed' },
  CANCELLED:            { variant: 'destructive', label: 'Cancelled' },
}

interface MyListingCardProps {
  adj: Adjustment
}

export function MyListingCard({ adj }: MyListingCardProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusInfo = STATUS_BADGE[adj.status] ?? { variant: 'secondary' as const, label: adj.status }

  const expiresAt = adj.expires_at ? new Date(adj.expires_at) : null
  const hoursLeft = expiresAt
    ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 3600000))
    : null

  const dateDisplay = new Date(adj.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishListing(adj.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Published!', description: 'Your listing is now live in the marketplace.' })
      }
    })
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      const result = await deleteListing(adj.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Removed', description: 'Listing has been removed.' })
      }
      setConfirmDelete(false)
    })
  }

  return (
    <Card className={adj.status === 'DRAFT' ? 'border-dashed' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Status + type badges */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="outline">{adj.type}</Badge>
              <Badge variant="outline">{adj.listing_type === 'REQUEST' ? 'Requesting' : 'Offering'}</Badge>
            </div>

            {/* Date + shift */}
            <p className="text-sm font-medium text-gray-900">{dateDisplay}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              My shift: {formatTime(adj.original_shift_start)} – {formatTime(adj.original_shift_end)}
            </p>
            {adj.desired_shift_start && (
              <p className="text-xs text-gray-500">
                Wants: {formatTime(adj.desired_shift_start)} – {formatTime(adj.desired_shift_end)}
              </p>
            )}
            {adj.notes && (
              <p className="text-xs text-gray-400 mt-1 italic truncate">"{adj.notes}"</p>
            )}

            {/* Pending timer */}
            {adj.status === 'PENDING_CONFIRMATION' && hoursLeft !== null && (
              <div className="flex items-center gap-1 mt-1.5">
                <Clock className="h-3 w-3 text-amber-500" />
                <span className={`text-xs font-medium ${hoursLeft < 4 ? 'text-red-600' : 'text-amber-600'}`}>
                  {hoursLeft}h to enter Trade ID
                </span>
              </div>
            )}

            {/* Trade ID */}
            {adj.aspect_trade_id && (
              <p className="text-xs text-green-700 mt-1">Trade ID: {adj.aspect_trade_id}</p>
            )}

            {/* Accepter info */}
            {adj.accepter && (
              <p className="text-xs text-gray-500 mt-1">
                Accepted by: <span className="font-medium">{(adj.accepter as any).name}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            <Link href={`/listings/${adj.id}`} aria-label="View listing details">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="View listing details">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>

            {adj.status === 'DRAFT' && (
              <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={handlePublish} disabled={isPending}>
                <Send className="h-3 w-3" />
                Publish
              </Button>
            )}

            {['DRAFT', 'OPEN'].includes(adj.status) && (
              <Button
                size="sm"
                variant={confirmDelete ? 'destructive' : 'ghost'}
                className="gap-1 text-xs h-8"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="h-3 w-3" />
                {confirmDelete ? 'Confirm?' : 'Remove'}
              </Button>
            )}

            {adj.status === 'PENDING_CONFIRMATION' && (
              <Link href={`/listings/${adj.id}`}>
                <Button size="sm" className="text-xs h-8 bg-amber-500 hover:bg-amber-600">
                  Enter Trade ID
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
