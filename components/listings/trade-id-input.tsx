'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { confirmAdjustment } from '@/lib/actions/listings'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TradeIdInputProps {
  adjustmentId: string
  expiresAt: string | null
}

function useCountdown(expiresAt: string | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!expiresAt) return
    const interval = setInterval(() => setNow(Date.now()), 60_000) // update every minute
    return () => clearInterval(interval)
  }, [expiresAt])

  if (!expiresAt) return { hours: null, minutes: null, isExpired: false, isUrgent: false }

  const diffMs = new Date(expiresAt).getTime() - now
  if (diffMs <= 0) return { hours: 0, minutes: 0, isExpired: true, isUrgent: true }

  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  return { hours, minutes, isExpired: false, isUrgent: hours < 4 }
}

export function TradeIdInput({ adjustmentId, expiresAt }: TradeIdInputProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [tradeId, setTradeId] = useState('')
  const [isPending, startTransition] = useTransition()
  const { hours, minutes, isExpired, isUrgent } = useCountdown(expiresAt)

  const handleConfirm = () => {
    if (!tradeId.trim()) {
      toast({ title: 'Trade ID required', description: 'Enter the Aspect Trade ID.', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await confirmAdjustment(adjustmentId, tradeId.trim())
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
          <p className="text-sm font-semibold text-amber-800">Enter Aspect Trade ID</p>
          {hours !== null && minutes !== null && (
            <p className={cn('text-xs mt-0.5', isUrgent ? 'text-red-600 font-medium' : 'text-amber-600')}>
              {hours}h {minutes}m remaining to confirm
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="trade-id" className="text-xs font-medium text-amber-900">
          Trade ID (from Aspect)
        </Label>
        <Input
          id="trade-id"
          placeholder="e.g. TRK-123456"
          value={tradeId}
          onChange={(e) => setTradeId(e.target.value)}
          className="bg-white border-amber-300 focus:border-amber-500"
        />
      </div>

      <Button
        onClick={handleConfirm}
        disabled={isPending || !tradeId.trim()}
        className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
      >
        <CheckCircle className="h-4 w-4" />
        {isPending ? 'Confirming…' : 'Confirm Adjustment'}
      </Button>
    </div>
  )
}
