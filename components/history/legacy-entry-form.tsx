'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createLegacyAdjustment } from '@/lib/actions/legacy'
import { BookOpen, UserPlus } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface LegacyEntryFormProps {
  allUsers: Pick<Profile, 'id' | 'name' | 'email'>[]
  currentUserId: string
}

export function LegacyEntryForm({ allUsers, currentUserId }: LegacyEntryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState<'SWAP' | 'COVER'>('COVER')
  const [date, setDate] = useState('')
  const [shiftStart, setShiftStart] = useState('')
  const [shiftEnd, setShiftEnd] = useState('')
  const [otherUserId, setOtherUserId] = useState<string>('')
  const [otherPartyName, setOtherPartyName] = useState('')
  const [tradeId, setTradeId] = useState('')
  const [notes, setNotes] = useState('')
  const [role, setRole] = useState<'CREDITOR' | 'DEBTOR'>('DEBTOR')
  const [useUnregistered, setUseUnregistered] = useState(false)

  const otherUsers = allUsers.filter((u) => u.id !== currentUserId)

  const handleSubmit = () => {
    if (!date) {
      toast({ title: 'Date required', variant: 'destructive' })
      return
    }
    if (!useUnregistered && !otherUserId) {
      toast({ title: 'Select the other party', variant: 'destructive' })
      return
    }
    if (useUnregistered && !otherPartyName.trim()) {
      toast({ title: 'Enter the other party\'s name', variant: 'destructive' })
      return
    }

    startTransition(async () => {
      const result = await createLegacyAdjustment({
        type,
        date,
        shift_start: shiftStart,
        shift_end: shiftEnd,
        other_user_id: useUnregistered ? null : otherUserId,
        other_party_name: useUnregistered ? otherPartyName : null,
        aspect_trade_id: tradeId,
        notes,
        role,
      })

      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else if ('pending' in result && result.pending) {
        toast({
          title: 'Pending Debt Created',
          description: `Saved for ${otherPartyName}. Will be linked when they register.`,
        })
        resetForm()
      } else {
        toast({ title: 'Legacy Adjustment Added', description: 'Recorded and ledger updated.' })
        resetForm()
        router.refresh()
      }
    })
  }

  const resetForm = () => {
    setDate('')
    setShiftStart('')
    setShiftEnd('')
    setOtherUserId('')
    setOtherPartyName('')
    setTradeId('')
    setNotes('')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-purple-600" />
          Add Past Adjustment
        </CardTitle>
        <p className="text-xs text-gray-500">
          Record historical swaps/covers that happened before SWAPPER. These go directly to Confirmed status.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type + Role */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'SWAP' | 'COVER')}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COVER">Cover</SelectItem>
                <SelectItem value="SWAP">Swap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'COVER' && (
            <div className="space-y-1">
              <Label className="text-xs">Your Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'CREDITOR' | 'DEBTOR')}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBTOR">I was covered (I owe)</SelectItem>
                  <SelectItem value="CREDITOR">I gave the cover (owed to me)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
        </div>

        {/* Shift times */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Shift Start (optional)</Label>
            <Input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Shift End (optional)</Label>
            <Input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} className="h-9" />
          </div>
        </div>

        {/* Other party */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Other Party</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-purple-600"
              onClick={() => {
                setUseUnregistered(!useUnregistered)
                setOtherUserId('')
                setOtherPartyName('')
              }}
            >
              <UserPlus className="h-3 w-3" />
              {useUnregistered ? 'Pick registered user' : 'Not registered yet?'}
            </Button>
          </div>

          {useUnregistered ? (
            <div className="space-y-1">
              <Input
                placeholder="Enter their name (will link when they register)"
                value={otherPartyName}
                onChange={(e) => setOtherPartyName(e.target.value)}
                className="h-9"
              />
              <p className="text-[10px] text-amber-600">
                This will be stored as a pending debt and linked to their account when they register.
              </p>
            </div>
          ) : (
            <Select value={otherUserId} onValueChange={setOtherUserId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select a TP..." />
              </SelectTrigger>
              <SelectContent>
                {otherUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Trade ID */}
        <div className="space-y-1">
          <Label className="text-xs">Trade ID (optional)</Label>
          <Input
            placeholder="e.g. TRK-123456"
            value={tradeId}
            onChange={(e) => setTradeId(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <Label className="text-xs">Notes (optional)</Label>
          <Textarea
            placeholder="Any additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={isPending} className="w-full">
          {isPending ? 'Saving...' : 'Add Past Adjustment'}
        </Button>
      </CardContent>
    </Card>
  )
}
