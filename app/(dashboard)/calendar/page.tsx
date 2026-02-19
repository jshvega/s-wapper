import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MonthlyCalendar } from '@/components/calendar/monthly-calendar'
import { calculateEffectiveSchedule } from '@/lib/utils/schedule'
import { getMonthGridDates, formatDateKey } from '@/lib/utils/dates'
import type { Schedule, Adjustment } from '@/lib/types'
import { CalendarDays } from 'lucide-react'

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed

  // Step 1: Get the active bid period first so we can set the correct data fetch range
  const bidPeriodRes = await supabase
    .from('bid_periods')
    .select('name, start_date, end_date')
    .eq('is_active', true)
    .maybeSingle()

  const activeBidPeriod = bidPeriodRes.data ?? null

  // Step 2: Determine the date range to fetch.
  // If a bid period is active, fetch data for the ENTIRE bid period so the user
  // can navigate to any month within it (including Nov/Dec) and see their schedule.
  // Otherwise, fall back to 3 months around today.
  let fetchStart: Date
  let fetchEnd: Date

  if (activeBidPeriod) {
    const bidStartDate = new Date(activeBidPeriod.start_date + 'T12:00:00')
    const bidEndDate = new Date(activeBidPeriod.end_date + 'T12:00:00')
    fetchStart = getMonthGridDates(bidStartDate.getFullYear(), bidStartDate.getMonth())[0]
    fetchEnd = getMonthGridDates(bidEndDate.getFullYear(), bidEndDate.getMonth())[41]
  } else {
    fetchStart = getMonthGridDates(year, month - 1)[0]
    fetchEnd = getMonthGridDates(year, month + 1)[41]
  }

  const startStr = formatDateKey(fetchStart)
  const endStr = formatDateKey(fetchEnd)

  // Step 3: Fetch schedules and adjustments for the full range
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
    { start: fetchStart, end: fetchEnd }
  )

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your schedule with all adjustments. Click any day for details.
        </p>
      </div>

      {activeBidPeriod && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <CalendarDays className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="text-blue-800 font-medium">{activeBidPeriod.name}</span>
          <span className="text-blue-600">
            {new Date(activeBidPeriod.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(activeBidPeriod.end_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )}

      <MonthlyCalendar
        effectiveShifts={effectiveShifts}
        initialYear={year}
        initialMonth={month}
        today={today}
        currentUserId={user.id}
        bidPeriod={activeBidPeriod}
      />
    </div>
  )
}
