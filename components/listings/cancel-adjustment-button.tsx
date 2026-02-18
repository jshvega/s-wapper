'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cancelPendingAdjustment, cancelConfirmedAdjustment } from '@/lib/actions/listings'
import { useToast } from '@/hooks/use-toast'
import { XCircle } from 'lucide-react'

interface CancelAdjustmentButtonProps {
  adjustmentId: string
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED'
}

export function CancelAdjustmentButton({ adjustmentId, status }: CancelAdjustmentButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [confirmStep, setConfirmStep] = useState(false)

  const handleCancel = () => {
    if (!confirmStep) {
      setConfirmStep(true)
      return
    }

    startTransition(async () => {
      const action = status === 'PENDING_CONFIRMATION'
        ? cancelPendingAdjustment
        : cancelConfirmedAdjustment

      const result = await action(adjustmentId)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({
          title: 'Cancelled',
          description: status === 'CONFIRMED'
            ? 'Confirmed adjustment has been cancelled. Any ledger entries have been handled.'
            : 'Pending adjustment has been cancelled.',
        })
        router.push('/listings')
      }
      setConfirmStep(false)
    })
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
      <p className="text-sm font-medium text-red-800">
        {status === 'CONFIRMED'
          ? 'Cancel this confirmed adjustment? Any cover ledger entries will be reversed.'
          : 'Cancel this pending adjustment? No Trade ID has been entered yet.'}
      </p>
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
          {isPending ? 'Cancelling...' : confirmStep ? 'Yes, Cancel' : 'Cancel Adjustment'}
        </Button>
      </div>
    </div>
  )
}
