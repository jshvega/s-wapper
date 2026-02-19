import type { DayOfWeek } from '@/lib/types'

// Day-of-week mapping: JS getDay() → DayOfWeek enum
const JS_DAY_TO_DOW: Record<number, DayOfWeek> = {
  0: 'SUN',
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT',
}

export function jsDateToDayOfWeek(date: Date): DayOfWeek {
  return JS_DAY_TO_DOW[date.getDay()]
}

/** "HH:MM:SS" or "HH:MM" → "6:00 AM" */
export function formatTime(time: string | null | undefined): string | null {
  if (!time) return null
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${hour12}:${m} ${ampm}`
}

/** "HH:MM:SS" → "HH:MM" (for <input type="time">) */
export function timeToInputValue(time: string | null | undefined): string {
  if (!time) return ''
  return time.slice(0, 5)
}

/** "YYYY-MM-DD" → Date at midnight local */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date → "YYYY-MM-DD" */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Get the Monday of the week containing `date` */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday = 0 offset
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Get all 7 dates for the week containing `date`, Mon–Sun */
export function getWeekDates(date: Date): Date[] {
  const monday = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

/** Get all dates in the month grid (including leading/trailing days to fill 6 rows) */
export function getMonthGridDates(year: number, month: number): Date[] {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Find the Monday at or before the first day
  const gridStart = getWeekStart(firstDay)

  // Fill 6 weeks (42 days)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

/** Compare "HH:MM" or "HH:MM:SS" time strings. Returns minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Is date A the same calendar day as date B? */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Format a timestamp ISO string as "Feb 18, 2026 at 3:45 PM" */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Is the date in the current calendar month? */
export function isCurrentMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month
}

/** Format a date for display: "Mon, Feb 17" */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Format month header: "February 2026" */
export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}
