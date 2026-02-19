'use client'

import type { EffectiveShift } from '@/lib/types'
import { formatTime } from '@/lib/utils/dates'
import { cn } from '@/lib/utils'

interface DayCellProps {
  date: Date
  shift: EffectiveShift | undefined
  isToday: boolean
  isCurrentMonth: boolean
  isOutsideBidPeriod?: boolean
  onClick: () => void
}

export function DayCell({ date, shift, isToday, isCurrentMonth, isOutsideBidPeriod, onClick }: DayCellProps) {
  const effective = shift?.effectiveShift
  const isDayOff = shift?.isDayOff && !effective
  const isCovered = effective?.type === 'COVERED'
  const isCovering = effective?.type === 'COVERING'
  const isSwapped = effective?.type === 'SWAPPED'

  const pendingAdj = shift?.adjustments.filter((a) => a.status === 'PENDING_CONFIRMATION') ?? []
  const confirmedAdj = shift?.adjustments.filter((a) => a.status === 'CONFIRMED') ?? []
  const draftAdj = shift?.adjustments.filter((a) => a.status === 'DRAFT') ?? []

  return (
    <button
      onClick={onClick}
      disabled={isOutsideBidPeriod}
      className={cn(
        'relative min-h-[72px] md:min-h-[88px] w-full rounded-lg border p-1.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-400',
        // Outside bid period: gray out, disable pointer events
        isOutsideBidPeriod && 'opacity-20 cursor-not-allowed bg-gray-100 border-gray-100',
        // Inside bid period styles
        !isOutsideBidPeriod && 'hover:shadow-sm',
        !isOutsideBidPeriod && !isCurrentMonth && 'opacity-40',
        !isOutsideBidPeriod && isToday && 'ring-2 ring-blue-400 border-blue-300',
        !isOutsideBidPeriod && isDayOff && 'bg-blue-50 border-blue-100',
        !isOutsideBidPeriod && isCovered && 'bg-teal-50 border-teal-100',
        !isOutsideBidPeriod && isCovering && 'bg-purple-50 border-purple-100',
        !isOutsideBidPeriod && isSwapped && 'bg-indigo-50 border-indigo-100',
        !isOutsideBidPeriod && !isDayOff && !isCovered && !isCovering && !isSwapped && 'bg-white border-gray-100',
        !isOutsideBidPeriod && pendingAdj.length > 0 && 'bg-amber-50 border-amber-200',
      )}
    >
      {/* Date number */}
      <div className="flex items-start justify-between mb-1">
        <span
          className={cn(
            'text-sm font-semibold leading-none w-6 h-6 flex items-center justify-center rounded-full',
            !isOutsideBidPeriod && isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          )}
        >
          {date.getDate()}
        </span>

        {/* Status dots — only inside bid period */}
        {!isOutsideBidPeriod && (
          <div className="flex gap-0.5 mt-0.5">
            {draftAdj.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 border border-gray-400 border-dashed" />
            )}
            {pendingAdj.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
            {confirmedAdj.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Content — only inside bid period */}
      {!isOutsideBidPeriod && (
        <div className="space-y-0.5">
          {isDayOff ? (
            <span className="text-[10px] font-medium text-blue-500 px-1 py-0.5 bg-blue-100 rounded">
              OFF
            </span>
          ) : isCovered ? (
            <div>
              <span className="text-[10px] font-medium text-teal-700 px-1 py-0.5 bg-teal-100 rounded block truncate">
                Covered{effective?.relatedUser ? ` by ${(effective.relatedUser as any).name?.split(' ')[0]}` : ''}
              </span>
            </div>
          ) : isCovering ? (
            <div>
              <span className="text-[10px] font-medium text-purple-700 px-1 py-0.5 bg-purple-100 rounded block truncate">
                Covering{effective?.relatedUser ? ` ${(effective.relatedUser as any).name?.split(' ')[0]}` : ''}
              </span>
            </div>
          ) : effective ? (
            <div className="space-y-0.5">
              <p className={cn(
                'text-[11px] font-medium leading-tight',
                isSwapped ? 'text-indigo-700' : 'text-gray-700'
              )}>
                {formatTime(effective.start)}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight">
                – {formatTime(effective.end)}
              </p>
              {isSwapped && (
                <span className="text-[9px] text-indigo-500">↔ swap</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-gray-300">No schedule</span>
          )}

          {/* Pending confirmation badge */}
          {pendingAdj.length > 0 && (
            <span className="text-[9px] font-medium text-amber-700 bg-amber-100 px-1 py-0.5 rounded block">
              ⏱ Pending
            </span>
          )}
        </div>
      )}
    </button>
  )
}
