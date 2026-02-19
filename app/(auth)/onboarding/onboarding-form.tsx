'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setupSchedule } from '@/lib/actions/schedules'
import { useToast } from '@/hooks/use-toast'
import type { DayOfWeek } from '@/lib/types'

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MON', label: 'Monday' },
  { key: 'TUE', label: 'Tuesday' },
  { key: 'WED', label: 'Wednesday' },
  { key: 'THU', label: 'Thursday' },
  { key: 'FRI', label: 'Friday' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN', label: 'Sunday' },
]

type DayConfig = {
  day_of_week: DayOfWeek
  is_day_off: boolean
  shift_start: string
  shift_end: string
}

export function OnboardingForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [days, setDays] = useState<DayConfig[]>(
    DAYS.map((d) => ({
      day_of_week: d.key,
      is_day_off: d.key === 'SAT' || d.key === 'SUN',
      shift_start: '09:00',
      shift_end: '18:00',
    }))
  )

  const daysOffCount = days.filter((d) => d.is_day_off).length

  function toggleDayOff(index: number) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, is_day_off: !d.is_day_off } : d))
    )
  }

  function updateTime(index: number, field: 'shift_start' | 'shift_end', value: string) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (daysOffCount !== 2) {
      toast({ title: 'Invalid schedule', description: 'You must have exactly 2 days off.', variant: 'destructive' })
      return
    }

    setLoading(true)

    const result = await setupSchedule({
      days: days.map((d) => ({
        day_of_week: d.day_of_week,
        is_day_off: d.is_day_off,
        shift_start: d.is_day_off ? undefined : d.shift_start,
        shift_end: d.is_day_off ? undefined : d.shift_end,
      })),
    })

    setLoading(false)

    if (result?.error) {
      toast({ title: 'Setup failed', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Schedule saved!', description: 'Welcome to S-WAPPER.' })
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-xs text-gray-500 mb-4">
        Days off selected: <span className={daysOffCount === 2 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>{daysOffCount} / 2</span>
      </div>

      {DAYS.map((day, index) => {
        const config = days[index]
        return (
          <div key={day.key} className={`rounded-lg border p-4 ${config.is_day_off ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">{day.label}</span>
              <button
                type="button"
                onClick={() => toggleDayOff(index)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  config.is_day_off
                    ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.is_day_off ? 'Day Off' : 'Workday'}
              </button>
            </div>

            {!config.is_day_off && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Start time</Label>
                  <Input
                    type="time"
                    value={config.shift_start}
                    onChange={(e) => updateTime(index, 'shift_start', e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">End time</Label>
                  <Input
                    type="time"
                    value={config.shift_end}
                    onChange={(e) => updateTime(index, 'shift_end', e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}

      <Button type="submit" className="w-full mt-6" disabled={loading || daysOffCount !== 2}>
        {loading ? 'Saving...' : 'Save Schedule & Continue'}
      </Button>
    </form>
  )
}
