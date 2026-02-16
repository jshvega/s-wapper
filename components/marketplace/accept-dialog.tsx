'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { acceptListing } from '@/lib/actions/listings'
import { formatTime } from '@/lib/utils/dates'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, User } from 'lucide-react'
import type { Adjustment } from '@/lib/types'

interface AcceptDialogProps {
  adj: Adjustment | null
  onClose: () => void
}

export function AcceptDialog({ adj, onClose }: AcceptDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  if (!adj) return null

  const dateDisplay = new Date(adj.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptListing(adj.id)
      if (result.error) {
        toast({ title: 'Could not accept', description: result.error, variant: 'destructive' })
        onClose()
      } else {
        toast({
          title: 'Accepted!',
          description: 'You have 24 hours to enter the Aspect Track ID.',
        })
        onClose()
        router.push(`/listings/${adj.id}`)
      }
    })
  }

  const isSwap = adj.type === 'SWAP'

  return (
    <Dialog open={!!adj} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Accept {adj.type === 'SWAP' ? 'Swap' : 'Cover'}?</DialogTitle>
          <DialogDescription>
            {isSwap
              ? "You'll swap shifts with this person. Once you accept, both of you have 24 hours to confirm with an Aspect Track ID."
              : adj.listing_type === 'REQUEST'
              ? "You'll be covering their shift. A cover obligation will be created once confirmed."
              : "They'll be covering your shift. A cover obligation will be created once confirmed."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2">
            <Badge variant={adj.type === 'SWAP' ? 'purple' : 'teal'}>{adj.type}</Badge>
            <Badge variant="outline">{adj.listing_type === 'REQUEST' ? 'Needs help' : 'Offering'}</Badge>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-medium">{(adj.creator as any)?.name ?? 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm">{dateDisplay}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm">
                {formatTime(adj.original_shift_start)} – {formatTime(adj.original_shift_end)}
              </span>
            </div>
            {adj.desired_shift_start && (
              <div className="text-xs text-gray-500 pl-5">
                Wants: {formatTime(adj.desired_shift_start)} – {formatTime(adj.desired_shift_end)}
              </div>
            )}
          </div>

          {adj.notes && (
            <>
              <Separator />
              <p className="text-sm text-gray-600 italic px-1">"{adj.notes}"</p>
            </>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-medium text-amber-800">After accepting:</p>
            <p className="text-xs text-amber-700 mt-1">
              You and {(adj.creator as any)?.name?.split(' ')[0]} will have 24 hours to enter the Aspect Track ID to confirm the adjustment.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={isPending}>
            {isPending ? 'Accepting…' : 'Confirm Accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
