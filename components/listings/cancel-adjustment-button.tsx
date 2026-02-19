'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { deleteListing, cancelPendingAdjustment, cancelConfirmedAdjustment } from '@/lib/actions/listings'
import { useToast } from '@/hooks/use-toast'
import { XCircle } from 'lucide-react'

type CancellableStatus = 'DRAFT' | 'OPEN' | 'PENDING_CONFIRMATION' | 'CONFIRMED'

interface CancelAdjustmentButtonProps {
  adjustmentId: string
  status: CancellableStatus
}

const MESSAGES: Record<CancellableStatus, { warning: string; success: string }> = {
  DRAFT:                { warning: 'Remove this draft listing? It will be permanently deleted.', success: 'Draft removed.' },
  OPEN:                 { warning: 'Withdraw this listing from the marketplace? No one has accepted it yet.', success: 'Listing withdrawn from marketplace.' },
  PENDING_CONFIRMATION: { warning: 'Cancel this pending adjustment? No Trade ID has been entered yet.', success: 'Pending adjustment has been cancelled.' },
  CONFIRMED:            { warning: 'Cancel this confirmed adjustment? Any cover ledger entries will be reversed.', success: 'Confirmed adjustment has been cancelled. Any ledger entries have been handled.' },
}

export function CancelAdjustmentButton({ adjustmentId, status }: CancelAdjustmentButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [confirmStep, setConfirmStep] = useState(false)

  const msg = MESSAGES[status]

  const handleCancel = () => {
    if (!confirmStep) {
      setConfirmStep(true)
      return
    }

    startTransition(async () => {
      let result: { error?: string; success?: boolean }

      if (status === 'DRAFT' || status === 'OPEN') {
        result = await deleteListing(adjustmentId)
      } else if (status === 'PENDING_CONFIRMATION') {
        result = await cancelPendingAdjustment(adjustmentId)
      } else {
        result = await cancelConfirmedAdjustment(adjustmentId)
      }

      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Done', description: msg.success })
        router.push('/listings')
      }
      setConfirmStep(false)
    })
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
      <p className="text-sm font-medium text-red-800">{msg.warning}</p>
      <div className="flex gap-2">
        {confirmStep && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmStep(false)}
            disabled={isPending}
          >
            Never mind
          </Button>
        )}
        <Button
          variant={confirmStep ? 'destructive' : 'outline'}
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
          className="gap-1"
        >
          <XCircle className="h-3.5 w-3.5" />
          {isPending
            ? 'Processing...'
            : confirmStep
              ? 'Yes, confirm'
              : status === 'DRAFT' ? 'Remove Draft'
              : status === 'OPEN' ? 'Withdraw Listing'
              : 'Cancel Adjustment'}
        </Button>
      </div>
    </div>
  )
}
