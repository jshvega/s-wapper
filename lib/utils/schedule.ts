import type { Schedule, Adjustment, Profile, EffectiveShift, EffectiveShiftType, DayOfWeek } from '@/lib/types'
import { jsDateToDayOfWeek, formatDateKey, timeToMinutes } from '@/lib/utils/dates'

/**
 * Given a user's base schedule and all their active adjustments,
 * compute the effective (actual expected) schedule for a date range.
 *
 * Rules applied:
 * - SWAP: the user works the OTHER person's shift on that date
 * - COVER given (user is accepter on OFFER, or creator on REQUEST where they're covering):
 *     user works the covered shift (marked COVERING)
 * - COVER received (user's shift is being covered):
 *     user is off (marked COVERED)
 *
 * Only CONFIRMED and PENDING_CONFIRMATION adjustments are counted.
 * DRAFT adjustments for the owner are shown as-is.
 */
export function calculateEffectiveSchedule(
  userId: string,
  baseSchedule: Schedule[],
  adjustments: Adjustment[],
  dateRange: { start: Date; end: Date }
): EffectiveShift[] {
  const results: EffectiveShift[] = []

  // Build a map of base schedule by day_of_week
  const scheduleByDay = new Map<DayOfWeek, Schedule>()
  for (const s of baseSchedule) {
    // Take the most recent effective_from for each day
    const existing = scheduleByDay.get(s.day_of_week)
    if (!existing || s.effective_from > existing.effective_from) {
      scheduleByDay.set(s.day_of_week, s)
    }
  }

  // Active adjustments that affect schedule display
  const activeStatuses = new Set(['PENDING_CONFIRMATION', 'CONFIRMED'])
  const draftStatuses = new Set(['DRAFT'])

  const current = new Date(dateRange.start)
  current.setHours(0, 0, 0, 0)
  const end = new Date(dateRange.end)
  end.setHours(23, 59, 59, 999)

  while (current <= end) {
    const dateKey = formatDateKey(current)
    const dayOfWeek = jsDateToDayOfWeek(current)
    const baseDay = scheduleByDay.get(dayOfWeek)

    // Find all adjustments for this specific date
    const dayAdjustments = adjustments.filter((a) => a.date === dateKey)

    // Find active adjustments (CONFIRMED or PENDING) for this date
    const activeAdj = dayAdjustments.filter((a) => activeStatuses.has(a.status))
    const draftAdj = dayAdjustments.filter(
      (a) => draftStatuses.has(a.status) && a.creator_id === userId
    )
    const allRelevantAdj = [...activeAdj, ...draftAdj]

    let effectiveShift: EffectiveShift['effectiveShift'] = null

    if (baseDay) {
      if (baseDay.is_day_off) {
        // Base is day off — check if they're covering someone
        const coveringAdj = activeAdj.find(
          (a) =>
            a.type === 'COVER' &&
            ((a.listing_type === 'OFFER' && a.creator_id === userId) ||
              (a.listing_type === 'REQUEST' && a.accepter_id === userId))
        )
        if (coveringAdj) {
          effectiveShift = {
            start: coveringAdj.original_shift_start,
            end: coveringAdj.original_shift_end,
            type: 'COVERING',
            relatedUser: coveringAdj.creator_id === userId ? coveringAdj.accepter as Profile | undefined : coveringAdj.creator as Profile | undefined,
          }
        } else {
          // Still a day off
          effectiveShift = null
        }
      } else {
        // Base is a workday
        effectiveShift = {
          start: baseDay.shift_start,
          end: baseDay.shift_end,
          type: 'BASE',
        }

        // Check for adjustments that modify this
        for (const adj of activeAdj) {
          if (adj.type === 'SWAP') {
            // Both parties swap their shift times
            const isCreator = adj.creator_id === userId
            effectiveShift = {
              start: isCreator
                ? (adj.desired_shift_start ?? adj.original_shift_start)
                : adj.original_shift_start,
              end: isCreator
                ? (adj.desired_shift_end ?? adj.original_shift_end)
                : adj.original_shift_end,
              type: 'SWAPPED',
              relatedUser: isCreator
                ? (adj.accepter as Profile | undefined)
                : (adj.creator as Profile | undefined),
            }
          } else if (adj.type === 'COVER') {
            // Is this user having their shift covered (receiving)?
            const isReceivingCover =
              (adj.listing_type === 'REQUEST' && adj.creator_id === userId) ||
              (adj.listing_type === 'OFFER' && adj.accepter_id === userId)

            // Is this user giving the cover?
            const isGivingCover =
              (adj.listing_type === 'OFFER' && adj.creator_id === userId) ||
              (adj.listing_type === 'REQUEST' && adj.accepter_id === userId)

            if (isReceivingCover) {
              effectiveShift = {
                start: null,
                end: null,
                type: 'COVERED',
                relatedUser: isReceivingCover
                  ? (adj.listing_type === 'REQUEST'
                      ? (adj.accepter as Profile | undefined)
                      : (adj.creator as Profile | undefined))
                  : undefined,
              }
            } else if (isGivingCover) {
              effectiveShift = {
                start: adj.original_shift_start,
                end: adj.original_shift_end,
                type: 'COVERING',
                relatedUser:
                  adj.listing_type === 'OFFER'
                    ? (adj.accepter as Profile | undefined)
                    : (adj.creator as Profile | undefined),
              }
            }
          }
        }
      }
    }

    results.push({
      date: dateKey,
      shiftStart: baseDay?.shift_start ?? null,
      shiftEnd: baseDay?.shift_end ?? null,
      isDayOff: baseDay?.is_day_off ?? false,
      adjustments: allRelevantAdj,
      effectiveShift,
    })

    current.setDate(current.getDate() + 1)
  }

  return results
}

/**
 * Validate the 8-hour rest rule between two shifts.
 * Returns true if the gap between endTime on prevDate and startTime on nextDate is >= 8 hours.
 */
export function hasEnoughRest(
  prevShiftEnd: string,
  nextShiftStart: string,
  spansDays: number = 1 // how many days apart the shifts are
): boolean {
  const endMinutes = timeToMinutes(prevShiftEnd)
  const startMinutes = timeToMinutes(nextShiftStart) + spansDays * 24 * 60
  return startMinutes - endMinutes >= 8 * 60
}

/** Get the day-of-week label for display */
export const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
}

export const DAY_ORDER: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
