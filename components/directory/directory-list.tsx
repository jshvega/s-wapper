'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatTime } from '@/lib/utils/dates'
import { Search, Clock, CalendarOff } from 'lucide-react'
import type { DayOfWeek } from '@/lib/types'
import type { DirectoryEntry } from '@/app/(dashboard)/directory/page'

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
}

const DAY_ORDER: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/** Filter options for days off */
const DAY_OFF_FILTERS: { label: string; value: DayOfWeek }[] = DAY_ORDER.map((d) => ({
  label: DAY_LABELS[d],
  value: d,
}))

interface DirectoryListProps {
  entries: DirectoryEntry[]
  currentUserId: string
}

/** Get the most common (non-off) shift for a TP, or null if all days off. */
function getPrimaryShift(entry: DirectoryEntry): { start: string; end: string } | null {
  const workDays = DAY_ORDER
    .map((d) => entry.schedule[d])
    .filter((s) => !s.is_day_off && s.shift_start && s.shift_end)

  if (workDays.length === 0) return null

  // Count shift patterns to find most common
  const counts: Record<string, number> = {}
  for (const s of workDays) {
    const key = `${s.shift_start}|${s.shift_end}`
    counts[key] = (counts[key] ?? 0) + 1
  }

  let maxKey = ''
  let maxCount = 0
  for (const key of Object.keys(counts)) {
    if (counts[key] > maxCount) {
      maxKey = key
      maxCount = counts[key]
    }
  }

  const [start, end] = maxKey.split('|')
  return { start, end }
}

/** Get days off as short labels. */
function getDaysOff(entry: DirectoryEntry): string[] {
  return DAY_ORDER
    .filter((d) => entry.schedule[d].is_day_off)
    .map((d) => DAY_LABELS[d])
}

/** Get days off as DayOfWeek keys (for filtering). */
function getDaysOffKeys(entry: DirectoryEntry): DayOfWeek[] {
  return DAY_ORDER.filter((d) => entry.schedule[d].is_day_off)
}

export function DirectoryList({ entries, currentUserId }: DirectoryListProps) {
  const [search, setSearch] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<DirectoryEntry | null>(null)
  const [dayOffFilter, setDayOffFilter] = useState<DayOfWeek | ''>('')

  const filtered = useMemo(() => {
    let result = entries

    // Name search
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((e) => {
        // Match name
        if (e.profile.name.toLowerCase().includes(q)) return true

        // Match shift time (e.g. "9:00" or "6:00 AM")
        const shift = getPrimaryShift(e)
        if (shift) {
          const shiftStr = `${formatTime(shift.start)} ${formatTime(shift.end)}`.toLowerCase()
          if (shiftStr.includes(q)) return true
        }

        // Match day off labels (e.g. "wed", "thu")
        const daysOff = getDaysOff(e).join(' ').toLowerCase()
        if (daysOff.includes(q)) return true

        return false
      })
    }

    // Day off filter
    if (dayOffFilter) {
      result = result.filter((e) => getDaysOffKeys(e).includes(dayOffFilter))
    }

    return result
  }, [entries, search, dayOffFilter])

  return (
    <>
      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, shift time, or day off..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Day off filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500 self-center mr-1">Off on:</span>
          <button
            onClick={() => setDayOffFilter('')}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              dayOffFilter === ''
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            All
          </button>
          {DAY_OFF_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setDayOffFilter(dayOffFilter === f.value ? '' : f.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                dayOffFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          {search || dayOffFilter ? 'No TPs match your filters.' : 'No active TPs found.'}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map((entry) => {
            const shift = getPrimaryShift(entry)
            const daysOff = getDaysOff(entry)

            return (
              <Card
                key={entry.profile.id}
                className="cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => setSelectedEntry(entry)}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-sm shrink-0 mt-0.5">
                      {entry.profile.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {entry.profile.name}
                          {entry.profile.id === currentUserId && (
                            <span className="text-xs text-gray-400 font-normal ml-1">(you)</span>
                          )}
                        </p>
                        {entry.profile.role === 'ADMIN' && (
                          <Badge variant="purple" className="text-[10px] px-1.5 py-0">Admin</Badge>
                        )}
                      </div>

                      {/* Shift time + days off */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {shift && (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {formatTime(shift.start)} – {formatTime(shift.end)}
                          </span>
                        )}
                        {daysOff.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-blue-600">
                            <CalendarOff className="h-3 w-3 text-blue-400" />
                            Off: {daysOff.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Schedule detail modal */}
      <Dialog open={selectedEntry !== null} onOpenChange={(open) => { if (!open) setSelectedEntry(null) }}>
        {selectedEntry && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-sm shrink-0">
                  {selectedEntry.profile.name.charAt(0).toUpperCase()}
                </div>
                {selectedEntry.profile.name}
              </DialogTitle>
              <DialogDescription>
                {selectedEntry.profile.role === 'ADMIN' ? 'Admin' : 'Travel Professional'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 mt-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Weekly Schedule
              </p>
              {DAY_ORDER.map((day) => {
                const s = selectedEntry.schedule[day]
                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between py-2 px-3 rounded-md text-sm ${
                      s.is_day_off ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-gray-700 w-12">{DAY_LABELS[day]}</span>
                    {s.is_day_off ? (
                      <Badge variant="info" className="text-xs">OFF</Badge>
                    ) : (
                      <span className="text-gray-600">
                        {formatTime(s.shift_start)} – {formatTime(s.shift_end)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
