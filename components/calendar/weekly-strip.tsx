import { Badge } from '@/components/ui/badge'
import type { EffectiveShift } from '@/lib/types'
import { formatTime, isSameDay } from '@/lib/utils/dates'
import { DAY_LABELS } from '@/lib/utils/schedule'
import { cn } from '@/lib/utils'

interface WeeklyStripProps {
  effectiveShifts: EffectiveShift[]
  /** The dates for Mon–Sun of the displayed week */
  weekDates: Date[]
  today: Date
}

export function WeeklyStrip({ effectiveShifts, weekDates, today }: WeeklyStripProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {weekDates.map((date) => {
        const dateStr = date.toISOString().split('T')[0]
        // Normalise to YYYY-MM-DD without timezone shift
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        const key = `${y}-${m}-${d}`

        const shift = effectiveShifts.find((s) => s.date === key)
        const isToday = isSameDay(date, today)
        const effective = shift?.effectiveShift ?? null

        return (
          <DayStrip
            key={key}
            date={date}
            isToday={isToday}
            shift={shift}
            effective={effective}
          />
        )
      })}
    </div>
  )
}

function DayStrip({
  date,
  isToday,
  shift,
  effective,
}: {
  date: Date
  isToday: boolean
  shift?: EffectiveShift
  effective: EffectiveShift['effectiveShift']
}) {
  const dow = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()] as keyof typeof DAY_LABELS

  // Determine visual style
  const isDayOff = shift?.isDayOff && !effective
  const isCovered = effective?.type === 'COVERED'
  const isCovering = effective?.type === 'COVERING'
  const isSwapped = effective?.type === 'SWAPPED'
  const hasPending = shift?.adjustments.some((a) => a.status === 'PENDING_CONFIRMATION')
  const hasConfirmed = shift?.adjustments.some((a) => a.status === 'CONFIRMED')
  const hasDraft = shift?.adjustments.some((a) => a.status === 'DRAFT')

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg p-2 text-center transition-colors min-w-0',
        isToday && 'ring-2 ring-blue-400',
        isDayOff && 'bg-blue-50',
        isCovered && 'bg-teal-50',
        isCovering && 'bg-purple-50',
        !isDayOff && !isCovered && !isCovering && 'bg-white',
        hasPending && 'bg-amber-50',
      )}
    >
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
        {DAY_LABELS[dow]}
      </span>
      <span
        className={cn(
          'text-lg font-bold mt-0.5 leading-none',
          isToday ? 'text-blue-600' : 'text-gray-900'
        )}
      >
        {date.getDate()}
      </span>

      <div className="mt-1.5 w-full space-y-0.5 min-h-[28px] flex flex-col items-center justify-start">
        {isDayOff ? (
          <span className="text-[10px] text-blue-500 font-medium">OFF</span>
        ) : isCovered ? (
          <>
            <span className="text-[10px] text-teal-600 font-medium leading-tight">Covered</span>
            {effective?.relatedUser && (
              <span className="text-[9px] text-teal-500 truncate w-full leading-tight">
                by {(effective.relatedUser as any).name?.split(' ')[0]}
              </span>
            )}
          </>
        ) : isCovering ? (
          <>
            <span className="text-[10px] text-purple-600 font-medium leading-tight">Covering</span>
            {effective?.relatedUser && (
              <span className="text-[9px] text-purple-500 truncate w-full leading-tight">
                {(effective.relatedUser as any).name?.split(' ')[0]}
              </span>
            )}
          </>
        ) : effective ? (
          <>
            <span className={cn('text-[10px] font-medium leading-tight', isSwapped ? 'text-indigo-600' : 'text-gray-700')}>
              {formatTime(effective.start)}
            </span>
            {isSwapped && (
              <span className="text-[9px] text-indigo-400 leading-tight">swap</span>
            )}
            {hasPending && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />
            )}
            {hasConfirmed && !hasPending && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mt-0.5" />
            )}
            {hasDraft && !hasPending && !hasConfirmed && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mt-0.5" />
            )}
          </>
        ) : (
          <span className="text-[10px] text-gray-300">—</span>
        )}
      </div>
    </div>
  )
}
