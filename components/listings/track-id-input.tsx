'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { confirmAdjustment } from '@/lib/actions/listings'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Clock } from 'lucide-react'

interface TrackIdInputProps {
  adjustmentId: string
  expiresAt: string | null
}

export function TrackIdInput({ adjustmentId, expiresAt }: TrackIdInputProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [trackId, setTrackId] = useState('')
  const [isPending, startTransition] = useTransition()

  const expiresDate = expiresAt ? new Date(expiresAt) : null
  const hoursLeft = expiresDate
    ? Math.max(0, Math.floor((expiresDate.getTime() - Date.now()) / 3600000))
    : null
  const isExpired = expiresDate ? expiresDate < new Date() : false

  const handleConfirm = () => {
    if (!trackId.trim()) {
      toast({ title: 'Track ID required', description: 'Enter the Aspect Track ID.', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await confirmAdjustment(adjustmentId, trackId.trim())
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Confirmed!', description: 'Adjustment confirmed successfully.' })
        router.push('/listings')
      }
    })
  }

  if (isExpired) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-700">Confirmation window expired</p>
        <p className="text-xs text-red-600 mt-1">The 24-hour window has passed. This adjustment has expired.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Enter Aspect Track ID</p>
          {hoursLeft !== null && (
            <p className={`text-xs mt-0.5 ${hoursLeft < 4 ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
              {hoursLeft}h remaining to confirm
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="track-id" className="text-xs font-medium text-amber-900">
          Track ID (from Aspect)
        </Label>
        <Input
          id="track-id"
          placeholder="e.g. TRK-123456"
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          className="bg-white border-amber-300 focus:border-amber-500"
        />
      </div>

      <Button
        onClick={handleConfirm}
        disabled={isPending || !trackId.trim()}
        className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
      >
        <CheckCircle className="h-4 w-4" />
        {isPending ? 'Confirming…' : 'Confirm Adjustment'}
      </Button>
    </div>
  )
}
