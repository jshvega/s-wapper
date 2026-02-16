'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatTime } from '@/lib/utils/dates'
import { Calendar, Clock, User, ArrowRight, AlertCircle } from 'lucide-react'
import type { Adjustment, RuleViolation } from '@/lib/types'

interface ListingCardProps {
  adj: Adjustment
  canAccept: boolean
  violations: RuleViolation[]
  onAccept: (adj: Adjustment) => void
}

export function ListingCard({ adj, canAccept, violations, onAccept }: ListingCardProps) {
  const dateDisplay = new Date(adj.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card className={`transition-colors ${canAccept ? 'hover:border-blue-300' : 'opacity-80'}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Type badges */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <Badge variant={adj.type === 'SWAP' ? 'purple' : 'teal'}>
                {adj.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {adj.listing_type === 'REQUEST' ? 'Needs help' : 'Offering'}
              </Badge>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-900">
                {(adj.creator as any)?.name ?? 'Unknown'}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{dateDisplay}</span>
            </div>

            {/* Shift times */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">
                {formatTime(adj.original_shift_start)} – {formatTime(adj.original_shift_end)}
              </span>
            </div>

            {/* Desired shift */}
            {adj.desired_shift_start && (
              <div className="flex items-center gap-1.5 mt-1">
                <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500">
                  Wants: {formatTime(adj.desired_shift_start)} – {formatTime(adj.desired_shift_end)}
                </span>
              </div>
            )}

            {/* Notes */}
            {adj.notes && (
              <p className="text-xs text-gray-400 mt-1.5 italic truncate">"{adj.notes}"</p>
            )}

            {/* Rule violation reason */}
            {!canAccept && violations.length > 0 && (
              <div className="flex items-start gap-1.5 mt-2 text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p className="text-xs leading-snug">{violations[0].message}</p>
              </div>
            )}
          </div>

          {/* Accept button */}
          <div className="shrink-0">
            {canAccept ? (
              <Button
                size="sm"
                onClick={() => onAccept(adj)}
                className="gap-1"
              >
                Accept
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled className="text-xs text-gray-400 cursor-not-allowed">
                Can't Accept
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
