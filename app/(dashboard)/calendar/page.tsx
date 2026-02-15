import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MonthlyCalendar } from '@/components/calendar/monthly-calendar'
import { calculateEffectiveSchedule } from '@/lib/utils/schedule'
import { getMonthGridDates, formatDateKey } from '@/lib/utils/dates'
import type { Schedule, Adjustment } from '@/lib/types'

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed

  // Fetch 3 months of data (prev, current, next) so nav feels instant
  const gridStart = getMonthGridDates(year, month - 1)[0]
  const gridEnd = getMonthGridDates(year, month + 1)[41]
  const startStr = formatDateKey(gridStart)
  const endStr = formatDateKey(gridEnd)

  const [schedulesRes, adjustmentsRes] = await Promise.all([
    supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('effective_from', { ascending: false }),
    supabase
      .from('adjustments')
      .select('*, creator:profiles!creator_id(id, name), accepter:profiles!accepter_id(id, name)')
      .gte('date', startStr)
      .lte('date', endStr)
      .or(`creator_id.eq.${user.id},accepter_id.eq.${user.id}`)
      .in('status', ['DRAFT', 'OPEN', 'PENDING_CONFIRMATION', 'CONFIRMED'])
      .order('date', { ascending: true }),
  ])

  const schedules = (schedulesRes.data ?? []) as Schedule[]
  const adjustments = (adjustmentsRes.data ?? []) as Adjustment[]

  const effectiveShifts = calculateEffectiveSchedule(
    user.id,
    schedules,
    adjustments,
    { start: gridStart, end: gridEnd }
  )

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your schedule with all adjustments. Click any day for details.
        </p>
      </div>

      <MonthlyCalendar
        effectiveShifts={effectiveShifts}
        initialYear={year}
        initialMonth={month}
        today={today}
        currentUserId={user.id}
      />
    </div>
  )
}
