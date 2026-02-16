'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { updateNotificationPreferences } from '@/lib/actions/settings'
import type { NotificationPreferences, NotificationEventKey } from '@/lib/types'

const EVENT_LABELS: Record<NotificationEventKey, string> = {
  accepted: 'Listing accepted',
  timer_warning: 'Confirmation reminder (4hr)',
  confirmed: 'Adjustment confirmed',
  expired: 'Adjustment expired',
  shift_reminder: 'Shift reminder (day before)',
  obligation_created: 'Cover obligation created',
}

const EVENT_ORDER: NotificationEventKey[] = [
  'accepted',
  'timer_warning',
  'confirmed',
  'expired',
  'shift_reminder',
  'obligation_created',
]

interface NotificationPreferencesEditorProps {
  preferences: NotificationPreferences
}

export function NotificationPreferencesEditor({ preferences }: NotificationPreferencesEditorProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(preferences)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function toggle(channel: 'email' | 'sms', key: NotificationEventKey) {
    setSaved(false)
    setPrefs((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: !prev[channel][key],
      },
    }))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateNotificationPreferences(prefs)
      if (!result.error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_60px_60px] gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
        <span>Event</span>
        <span className="text-center">Email</span>
        <span className="text-center">SMS</span>
      </div>

      {/* Rows */}
      {EVENT_ORDER.map((key) => (
        <div
          key={key}
          className="grid grid-cols-[1fr_60px_60px] gap-2 items-center py-2 px-1 rounded-md hover:bg-gray-50"
        >
          <span className="text-sm text-gray-700">{EVENT_LABELS[key]}</span>
          <div className="flex justify-center">
            <ToggleButton
              checked={prefs.email[key]}
              onClick={() => toggle('email', key)}
            />
          </div>
          <div className="flex justify-center">
            <ToggleButton
              checked={prefs.sms[key]}
              onClick={() => toggle('sms', key)}
            />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </div>
  )
}

function ToggleButton({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
