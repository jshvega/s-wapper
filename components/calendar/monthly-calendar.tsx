'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DayCell } from '@/components/calendar/day-cell'
import { DayDetailModal } from '@/components/calendar/day-detail-modal'
import type { EffectiveShift } from '@/lib/types'
import {
  getMonthGridDates,
  formatMonthYear,
  isCurrentMonth as checkCurrentMonth,
  isSameDay,
  formatTime,
} from '@/lib/utils/dates'
import { cn } from '@/lib/utils'

const DOW_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface MonthlyCalendarProps {
  effectiveShifts: EffectiveShift[]
  initialYear: number
  initialMonth: number  // 0-indexed
  today: Date
  currentUserId: string
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0=Sun…6=Sat
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return d
}

function getDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr =
    weekStart.getMonth() === weekEnd.getMonth()
      ? weekEnd.toLocaleDateString('en-US', { day: 'numeric' })
      : weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${startStr} – ${endStr}`
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
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(today))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const gridDates = getMonthGridDates(year, month)

  // Build a lookup map for fast access
  const shiftMap = new Map<string, EffectiveShift>()
  for (const s of effectiveShifts) {
    shiftMap.set(s.date, s)
  }

  // Desktop month navigation
  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else { setMonth((m) => m - 1) }
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else { setMonth((m) => m + 1) }
  }
  function goToToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setWeekStart(getMondayOfWeek(today))
  }

  // Mobile week navigation
  function prevWeek() {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  }
  function nextWeek() {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const selectedShift = selectedDate ? shiftMap.get(getDateKey(selectedDate)) : undefined

  return (
    <>
      {/* ── MOBILE: Week Agenda View ── */}
      <div className="md:hidden bg-white rounded-xl border overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {formatWeekRange(weekStart)}
            </span>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-7 text-xs px-2">
              Today
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week rows */}
        <div className="divide-y">
          {weekDates.map((date, idx) => {
            const key = getDateKey(date)
            const shift = shiftMap.get(key)
            const isToday = isSameDay(date, today)
            const effective = shift?.effectiveShift
            const isDayOff = shift?.isDayOff && !effective
            const isCovered = effective?.type === 'COVERED'
            const isCovering = effective?.type === 'COVERING'
            const isSwapped = effective?.type === 'SWAPPED'
            const pendingAdj = shift?.adjustments.filter((a) => a.status === 'PENDING_CONFIRMATION') ?? []
            const confirmedAdj = shift?.adjustments.filter((a) => a.status === 'CONFIRMED') ?? []

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100',
                  isToday && 'bg-blue-50',
                  !isToday && isDayOff && 'bg-blue-50/50',
                  !isToday && isCovered && 'bg-teal-50/50',
                  !isToday && isCovering && 'bg-purple-50/50',
                  !isToday && isSwapped && 'bg-indigo-50/50',
                  !isToday && pendingAdj.length > 0 && 'bg-amber-50/50',
                )}
              >
                {/* Day + date circle */}
                <div className="w-10 flex-shrink-0 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-medium leading-none mb-1">
                    {DOW_HEADERS[idx]}
                  </p>
                  <div
                    className={cn(
                      'mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold',
                      isToday ? 'bg-blue-600 text-white' : 'text-gray-900'
                    )}
                  >
                    {date.getDate()}
                  </div>
                </div>

                {/* Shift content */}
                <div className="flex-1 min-w-0">
                  {isDayOff ? (
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      Day Off
                    </span>
                  ) : isCovered ? (
                    <span className="text-xs font-medium text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full inline-block max-w-full truncate">
                      Covered{effective?.relatedUser ? ` by ${(effective.relatedUser as any).name?.split(' ')[0]}` : ''}
                    </span>
                  ) : isCovering ? (
                    <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full inline-block max-w-full truncate">
                      Covering{effective?.relatedUser ? ` ${(effective.relatedUser as any).name?.split(' ')[0]}` : ''}
                    </span>
                  ) : effective ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm font-medium', isSwapped ? 'text-indigo-700' : 'text-gray-800')}>
                        {formatTime(effective.start)} – {formatTime(effective.end)}
                      </span>
                      {isSwapped && (
                        <span className="text-[10px] text-indigo-500 font-medium">↔ swap</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">No schedule</span>
                  )}

                  {/* Status badges */}
                  {(pendingAdj.length > 0 || confirmedAdj.length > 0) && (
                    <div className="flex gap-1 mt-1">
                      {pendingAdj.length > 0 && (
                        <Badge variant="warning" className="text-[10px] h-4 px-1.5">⏱ Pending</Badge>
                      )}
                      {confirmedAdj.length > 0 && (
                        <Badge variant="success" className="text-[10px] h-4 px-1.5">✓ Confirmed</Badge>
                      )}
                    </div>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {/* Mobile legend */}
        <div className="flex flex-wrap gap-3 px-4 py-3 border-t bg-gray-50 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 inline-block" />
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
        </div>
      </div>

      {/* ── DESKTOP: Month Grid View ── */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              {formatMonthYear(year, month)}
            </h2>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-7 text-xs px-2">
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

      {/* Day detail modal (shared by both views) */}
      <DayDetailModal
        date={selectedDate}
        shift={selectedShift}
        onClose={() => setSelectedDate(null)}
        currentUserId={currentUserId}
      />
    </>
  )
}
