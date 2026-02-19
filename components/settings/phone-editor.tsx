'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePhone } from '@/lib/actions/settings'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Check, X } from 'lucide-react'

interface PhoneEditorProps {
  currentPhone: string | null
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return phone
  const last4 = digits.slice(-4)
  return `***-***-${last4}`
}

export function PhoneEditor({ currentPhone }: PhoneEditorProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentPhone ?? '')

  const handleSave = () => {
    startTransition(async () => {
      const result = await updatePhone(value)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Phone updated', description: value.trim() ? 'Your phone number has been saved.' : 'Phone number removed.' })
        setEditing(false)
      }
    })
  }

  const handleCancel = () => {
    setValue(currentPhone ?? '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Phone</p>
          <p className="font-medium text-gray-900">
            {currentPhone ? maskPhone(currentPhone) : <span className="text-gray-400 italic">Not set</span>}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
          {currentPhone ? 'Update' : 'Add'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="phone-input" className="text-xs text-gray-500">Phone number</Label>
      <Input
        id="phone-input"
        type="tel"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="+1 (555) 000-0000"
        autoComplete="tel"
        className="max-w-xs"
        disabled={isPending}
      />
      <p className="text-xs text-gray-400">Leave blank to remove your phone number.</p>
      <div className="flex gap-2">
        <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isPending}>
          <Check className="h-3.5 w-3.5" />
          {isPending ? 'Saving...' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={handleCancel} disabled={isPending}>
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
