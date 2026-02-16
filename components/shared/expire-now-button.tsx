'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { expireAdjustmentsNow } from '@/lib/actions/admin'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Timer } from 'lucide-react'

export function ExpireNowButton() {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleExpire = () => {
    startTransition(async () => {
      const result = await expireAdjustmentsNow()
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else if (result.expired === 0) {
        toast({ title: 'No expired adjustments', description: result.message ?? 'Nothing to expire.' })
      } else {
        toast({
          title: 'Adjustments expired',
          description: `${result.expired} adjustment(s) marked as expired.`,
        })
        router.refresh()
      }
    })
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleExpire}
      disabled={isPending}
      className="gap-2"
    >
      <Timer className="h-4 w-4" />
      {isPending ? 'Expiring…' : 'Expire Now'}
    </Button>
  )
}
