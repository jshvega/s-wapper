'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DayCell } from '@/components/calendar/day-cell'
import { DayDetailModal } from '@/components/calendar/day-detail-modal'
import type { EffectiveShift } from '@/lib/types'
import {
  getMonthGridDates,
  formatMonthYear,
  isCurrentMonth as checkCurrentMonth,
  isSameDay,
} from '@/lib/utils/dates'

const DOW_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface MonthlyCalendarProps {
  effectiveShifts: EffectiveShift[]
  initialYear: number
  initialMonth: number  // 0-indexed
  today: Date
  currentUserId: string
}

export function MonthlyCalendar({
  effectiveShifts,
  initialYear,
  initialMonth,
  today,
  currentUserId,
}: MonthlyCalendarProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const gridDates = getMonthGridDates(year, month)

  // Build a lookup map for fast access
  const shiftMap = new Map<string, EffectiveShift>()
  for (const s of effectiveShifts) {
    shiftMap.set(s.date, s)
  }

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  function goToToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  function getDateKey(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const selectedShift = selectedDate ? shiftMap.get(getDateKey(selectedDate)) : undefined

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              {formatMonthYear(year, month)}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-7 text-xs px-2"
            >
              Today
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b">
          {DOW_HEADERS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-medium text-gray-400 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 p-1.5 bg-gray-100">
          {gridDates.map((date) => {
            const key = getDateKey(date)
            const shift = shiftMap.get(key)
            const inMonth = checkCurrentMonth(date, year, month)
            const isToday = isSameDay(date, today)

            return (
              <DayCell
                key={key}
                date={date}
                shift={shift}
                isToday={isToday}
                isCurrentMonth={inMonth}
                onClick={() => setSelectedDate(date)}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 px-4 py-3 border-t bg-gray-50 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" />
            Day off
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Confirmed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-teal-100 border border-teal-200 inline-block" />
            Covered
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-purple-100 border border-purple-200 inline-block" />
            Covering
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200 inline-block" />
            Swapped
          </span>
        </div>
      </div>

      {/* Day detail modal */}
      <DayDetailModal
        date={selectedDate}
        shift={selectedShift}
        onClose={() => setSelectedDate(null)}
        currentUserId={currentUserId}
      />
    </>
  )
}
