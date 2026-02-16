'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { settleEntry } from '@/lib/actions/ledger'
import type { LedgerEntry, SettlementType } from '@/lib/types'
import { formatTime } from '@/lib/utils/dates'

interface SettleDialogProps {
  entry: LedgerEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
}

export function SettleDialog({ entry, open, onOpenChange, currentUserId }: SettleDialogProps) {
  const [settlementType, setSettlementType] = useState<SettlementType | ''>('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!entry) return null

  const otherPerson =
    entry.creditor_id === currentUserId ? entry.debtor : entry.creditor
  const adjDate = entry.adjustment?.date
    ? new Date(entry.adjustment.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown date'

  function handleSettle() {
    if (!settlementType || !entry) return
    setError(null)

    startTransition(async () => {
      const result = await settleEntry(entry.id, settlementType as SettlementType)
      if (result.error) {
        setError(result.error)
      } else {
        setSettlementType('')
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Settle Cover</DialogTitle>
          <DialogDescription>
            Mark this cover with {otherPerson?.name ?? 'Unknown'} on {adjDate} as settled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">Shift:</span>{' '}
              {formatTime(entry.adjustment?.original_shift_start ?? null)} –{' '}
              {formatTime(entry.adjustment?.original_shift_end ?? null)}
            </p>
            {entry.adjustment?.aspect_track_id && (
              <p>
                <span className="font-medium">Track ID:</span>{' '}
                {entry.adjustment.aspect_track_id}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">How was this settled?</label>
            <Select
              value={settlementType}
              onValueChange={(v) => setSettlementType(v as SettlementType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select settlement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COVER_RETURNED">Cover Returned</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="FORGIVEN">Forgiven</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSettle} disabled={!settlementType || isPending}>
            {isPending ? 'Settling...' : 'Mark as Settled'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
