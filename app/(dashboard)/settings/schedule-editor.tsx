'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSchedule } from '@/lib/actions/schedules'
import { useToast } from '@/hooks/use-toast'
import { DAY_ORDER, DAY_LABELS } from '@/lib/utils/schedule'
import { timeToInputValue } from '@/lib/utils/dates'
import type { Schedule, DayOfWeek } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DayConfig {
  day_of_week: DayOfWeek
  is_day_off: boolean
  shift_start: string
  shift_end: string
}

function buildInitialDays(schedules: Schedule[]): DayConfig[] {
  // Deduplicate: for each day, take the most recent effective_from
  const latestByDay = new Map<DayOfWeek, Schedule>()
  for (const s of schedules) {
    const existing = latestByDay.get(s.day_of_week)
    if (!existing || s.effective_from > existing.effective_from) {
      latestByDay.set(s.day_of_week, s)
    }
  }

  return DAY_ORDER.map((dow) => {
    const s = latestByDay.get(dow)
    return {
      day_of_week: dow,
      is_day_off: s?.is_day_off ?? (dow === 'SAT' || dow === 'SUN'),
      shift_start: timeToInputValue(s?.shift_start) || '09:00',
      shift_end: timeToInputValue(s?.shift_end) || '18:00',
    }
  })
}

export function ScheduleEditor({ schedules }: { schedules: Schedule[] }) {
  const [days, setDays] = useState<DayConfig[]>(() => buildInitialDays(schedules))
  const [loading, setLoading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const daysOffCount = days.filter((d) => d.is_day_off).length

  function toggleDayOff(index: number) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, is_day_off: !d.is_day_off } : d)))
    setDirty(true)
  }

  function updateTime(index: number, field: 'shift_start' | 'shift_end', value: string) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
    setDirty(true)
  }

  async function handleSave() {
    if (daysOffCount !== 2) {
      toast({ title: 'Invalid schedule', description: 'You must have exactly 2 days off.', variant: 'destructive' })
      return
    }

    setLoading(true)
    const result = await updateSchedule({
      days: days.map((d) => ({
        day_of_week: d.day_of_week,
        is_day_off: d.is_day_off,
        shift_start: d.is_day_off ? undefined : d.shift_start,
        shift_end: d.is_day_off ? undefined : d.shift_end,
      })),
    })
    setLoading(false)

    if (result?.error) {
      toast({ title: 'Save failed', description: result.error, variant: 'destructive' })
    } else {
      setDirty(false)
      toast({ title: 'Schedule saved', description: 'Your weekly schedule has been updated.' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      {/* Days-off counter */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">
          Days off:{' '}
          <span className={cn(
            'font-semibold',
            daysOffCount === 2 ? 'text-green-600' : 'text-red-500'
          )}>
            {daysOffCount} / 2
          </span>
          {daysOffCount !== 2 && (
            <span className="ml-1 text-red-400">(exactly 2 required)</span>
          )}
        </p>
      </div>

      {/* Day rows */}
      {DAY_ORDER.map((dow, index) => {
        const day = days[index]
        return (
          <div
            key={dow}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 transition-colors',
              day.is_day_off ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'
            )}
          >
            {/* Day label */}
            <div className="w-10 shrink-0">
              <span className="text-sm font-semibold text-gray-700">{DAY_LABELS[dow]}</span>
            </div>

            {/* Toggle */}
            <button
              type="button"
              onClick={() => toggleDayOff(index)}
              className={cn(
                'shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition-colors min-w-[72px] text-center',
                day.is_day_off
                  ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {day.is_day_off ? 'Day Off' : 'Workday'}
            </button>

            {/* Time inputs */}
            {day.is_day_off ? (
              <div className="flex-1 text-xs text-blue-400 italic">Rest day</div>
            ) : (
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-gray-400">Start</Label>
                  <Input
                    type="time"
                    value={day.shift_start}
                    onChange={(e) => updateTime(index, 'shift_start', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-gray-400">End</Label>
                  <Input
                    type="time"
                    value={day.shift_end}
                    onChange={(e) => updateTime(index, 'shift_end', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Save button */}
      <div className="flex items-center justify-between pt-2">
        {dirty && (
          <p className="text-xs text-amber-600">You have unsaved changes.</p>
        )}
        <Button
          onClick={handleSave}
          disabled={loading || daysOffCount !== 2}
          className="ml-auto"
        >
          {loading ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </div>
  )
}
