'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Adjustment } from '@/lib/types'

interface PendingConfirmationsProps {
  adjustments: Adjustment[]
  currentUserId: string
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const diffMs = new Date(expiresAt).getTime() - now
  if (diffMs <= 0) return <span className="text-red-500 font-medium">Expired</span>

  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  const isUrgent = hours < 4

  return (
    <span className={cn(isUrgent ? 'text-red-500 font-medium' : '')}>
      {' '}· {hours}h {minutes}m remaining
    </span>
  )
}

export function PendingConfirmations({ adjustments, currentUserId }: PendingConfirmationsProps) {
  if (adjustments.length === 0) return null

  return (
    <div className="space-y-3">
      {adjustments.map((adj) => {
        const isCreator = adj.creator_id === currentUserId

        return (
          <div
            key={adj.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 border-amber-200"
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="warning">{adj.type}</Badge>
                <span className="text-sm font-medium">
                  {isCreator ? 'Your listing' : `From ${(adj.creator as any)?.name}`}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(adj.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {adj.expires_at && <Countdown expiresAt={adj.expires_at} />}
              </p>
            </div>
            <Link href={`/listings/${adj.id}`}>
              <Button size="sm" variant="outline" className="text-xs">
                Enter Track ID
              </Button>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
