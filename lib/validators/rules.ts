/**
 * Rule enforcement for AA Travel Professional schedule adjustments.
 * All functions that query the DB take a Supabase client (server-side).
 * Call validateAcceptance() from the acceptListing server action.
 */

import { createClient } from '@/lib/supabase/server'
import { jsDateToDayOfWeek, timeToMinutes, getWeekStart, formatDateKey } from '@/lib/utils/dates'
import { hasEnoughRest } from '@/lib/utils/schedule'
import type { Schedule, Adjustment, RuleViolation, ValidationResult, DayOfWeek } from '@/lib/types'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Get the Monday–Sunday bounds of the calendar week containing dateStr */
function getWeekBounds(dateStr: string): { weekStart: string; weekEnd: string } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const monday = getWeekStart(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    weekStart: formatDateKey(monday),
    weekEnd: formatDateKey(sunday),
  }
}

/**
 * Get the first and last day of the calendar month containing dateStr,
 * expressed in CST (America/Chicago). Monthly cover limits use CST.
 */
function getMonthBoundsCST(dateStr: string): { monthStart: string; monthEnd: string } {
  // Convert the date string to a CST-aware date
  const [y, m, d] = dateStr.split('-').map(Number)
  const dateInCST = new Date(
    new Date(y, m - 1, d).toLocaleString('en-US', { timeZone: 'America/Chicago' })
  )
  const year = dateInCST.getFullYear()
  const month = dateInCST.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return {
    monthStart: formatDateKey(firstDay),
    monthEnd: formatDateKey(lastDay),
  }
}

/** Get the most-recent base schedule entry for each day of week */
function buildScheduleMap(schedules: Schedule[]): Map<DayOfWeek, Schedule> {
  const map = new Map<DayOfWeek, Schedule>()
  for (const s of schedules) {
    const existing = map.get(s.day_of_week)
    if (!existing || s.effective_from > existing.effective_from) {
      map.set(s.day_of_week, s)
    }
  }
  return map
}

/**
 * Get the actual shift times a user will work on a given date,
 * accounting for CONFIRMED/PENDING_CONFIRMATION adjustments.
 * Returns null if the user has no shift (day off, or covered).
 */
async function getEffectiveShiftOnDate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dateStr: string,
  scheduleMap: Map<DayOfWeek, Schedule>
): Promise<{ start: string; end: string } | null> {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dow = jsDateToDayOfWeek(dateObj)
  const baseDay = scheduleMap.get(dow)

  // Fetch active adjustments for this user on this date
  const { data: adjRows } = await supabase
    .from('adjustments')
    .select('id, type, listing_type, status, creator_id, accepter_id, original_shift_start, original_shift_end')
    .eq('date', dateStr)
    .in('status', ['CONFIRMED', 'PENDING_CONFIRMATION'])
    .or(`creator_id.eq.${userId},accepter_id.eq.${userId}`)

  const adjs = (adjRows ?? []) as Pick<
    Adjustment,
    | 'id'
    | 'type'
    | 'listing_type'
    | 'status'
    | 'creator_id'
    | 'accepter_id'
    | 'original_shift_start'
    | 'original_shift_end'
  >[]

  // Start from base schedule
  let start: string | null = baseDay && !baseDay.is_day_off ? baseDay.shift_start : null
  let end: string | null = baseDay && !baseDay.is_day_off ? baseDay.shift_end : null

  for (const adj of adjs) {
    if (adj.type === 'COVER') {
      const isReceiving =
        (adj.listing_type === 'REQUEST' && adj.creator_id === userId) ||
        (adj.listing_type === 'OFFER' && adj.accepter_id === userId)
      const isGiving =
        (adj.listing_type === 'REQUEST' && adj.accepter_id === userId) ||
        (adj.listing_type === 'OFFER' && adj.creator_id === userId)

      if (isReceiving) {
        // User's shift is covered — they don't work
        return null
      }
      if (isGiving) {
        // User is covering someone else — they work that shift
        start = adj.original_shift_start
        end = adj.original_shift_end
      }
    } else if (adj.type === 'SWAP') {
      // Accepter works the creator's (original) shift times
      // Creator works the accepter's base schedule times — we approximate with the listing shift
      if (adj.accepter_id === userId) {
        start = adj.original_shift_start
        end = adj.original_shift_end
      }
      // For creator of swap: their new shift is the accepter's base — keep base schedule as-is
      // (conservative approximation; exact times aren't stored for the creator)
    }
  }

  if (!start || !end) return null
  return { start, end }
}

// ---------------------------------------------------------------------------
// Rule 1: 8-Hour Rest Between Shifts
// ---------------------------------------------------------------------------

/**
 * Check that the proposing user will have ≥8 hours rest on the day before
 * and day after the proposed adjustment date.
 *
 * proposedStart/End are the shift times the user will ACTUALLY work on adjDate
 * (e.g. for a cover giver, these are the original_shift_start/end of the listing;
 *  for a swap accepter, same).
 */
export async function checkRestBetweenShifts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  adjDate: string, // "YYYY-MM-DD"
  proposedStart: string, // "HH:MM" or "HH:MM:SS"
  proposedEnd: string,
  scheduleMap: Map<DayOfWeek, Schedule>
): Promise<RuleViolation | null> {
  const [y, m, d] = adjDate.split('-').map(Number)
  const adjDateObj = new Date(y, m - 1, d)

  const dayBefore = new Date(adjDateObj)
  dayBefore.setDate(adjDateObj.getDate() - 1)
  const dayBeforeStr = formatDateKey(dayBefore)

  const dayAfter = new Date(adjDateObj)
  dayAfter.setDate(adjDateObj.getDate() + 1)
  const dayAfterStr = formatDateKey(dayAfter)

  const [prevShift, nextShift] = await Promise.all([
    getEffectiveShiftOnDate(supabase, userId, dayBeforeStr, scheduleMap),
    getEffectiveShiftOnDate(supabase, userId, dayAfterStr, scheduleMap),
  ])

  // Check: prev day end → proposed start (1 day span)
  if (prevShift && !hasEnoughRest(prevShift.end, proposedStart, 1)) {
    const prevDateLabel = dayBefore.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    return {
      rule: '8_HOUR_REST',
      message: `Not enough rest before this shift. Your shift on ${prevDateLabel} ends at ${fmtTime(prevShift.end)}, which is less than 8 hours before this shift starts at ${fmtTime(proposedStart)}.`,
    }
  }

  // Check: proposed end → next day start (1 day span)
  if (nextShift && !hasEnoughRest(proposedEnd, nextShift.start, 1)) {
    const nextDateLabel = dayAfter.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    return {
      rule: '8_HOUR_REST',
      message: `Not enough rest after this shift. This shift ends at ${fmtTime(proposedEnd)}, which is less than 8 hours before your shift on ${nextDateLabel} starts at ${fmtTime(nextShift.start)}.`,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Rule 2: Weekly Rest Requirement
// ---------------------------------------------------------------------------

/**
 * Check that the user won't be working BOTH of their assigned days off
 * in the calendar week of adjDate.
 *
 * This only applies when the user would be WORKING (giving a cover) on adjDate.
 */
export async function checkWeeklyRest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  adjDate: string,
  scheduleMap: Map<DayOfWeek, Schedule>
): Promise<RuleViolation | null> {
  // Get the user's two days off from their base schedule
  const daysOff: DayOfWeek[] = Array.from(scheduleMap.entries())
    .filter(([, s]) => s.is_day_off)
    .map(([dow]) => dow)
  if (daysOff.length < 2) return null // No days off configured (shouldn't happen)

  // Is adjDate one of their days off?
  const [y, m, d] = adjDate.split('-').map(Number)
  const adjDateObj = new Date(y, m - 1, d)
  const adjDow = jsDateToDayOfWeek(adjDateObj)
  const isProposedDayOff = daysOff.includes(adjDow)

  if (!isProposedDayOff) return null // Not on a day off — rule not triggered

  // adjDate is a day off. Check if the other day off in this week is already worked.
  const { weekStart, weekEnd } = getWeekBounds(adjDate)
  const otherDayOff = daysOff.find((dow) => dow !== adjDow)!

  // Find the calendar date of the other day off in this week
  const otherDayOffDate = getDayOfWeekInWeek(weekStart, otherDayOff)

  // Check if the user is already giving a cover on that other day off
  const { data: existingCovers } = await supabase
    .from('adjustments')
    .select('id, listing_type, creator_id, accepter_id')
    .eq('type', 'COVER')
    .eq('date', otherDayOffDate)
    .in('status', ['CONFIRMED', 'PENDING_CONFIRMATION'])
    .or(`creator_id.eq.${userId},accepter_id.eq.${userId}`)

  const isWorkingOtherDayOff = (existingCovers ?? []).some((adj: any) => {
    return (
      (adj.listing_type === 'REQUEST' && adj.accepter_id === userId) ||
      (adj.listing_type === 'OFFER' && adj.creator_id === userId)
    )
  })

  if (isWorkingOtherDayOff) {
    const adjDateLabel = adjDateObj.toLocaleDateString('en-US', { weekday: 'long' })
    const otherDayLabel = new Date(otherDayOffDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    return {
      rule: 'WEEKLY_REST',
      message: `You cannot work on ${adjDateLabel} — it's one of your assigned days off, and you're already working your other day off (${otherDayLabel}) this week. You must take at least 1 assigned day off as rest per week.`,
    }
  }

  return null
}

/** Get the calendar date (YYYY-MM-DD) of a given day-of-week within a Monday-start week */
function getDayOfWeekInWeek(weekStart: string, dow: DayOfWeek): string {
  const DOW_OFFSET: Record<DayOfWeek, number> = {
    MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6,
  }
  const [y, m, d] = weekStart.split('-').map(Number)
  const monday = new Date(y, m - 1, d)
  const target = new Date(monday)
  target.setDate(monday.getDate() + DOW_OFFSET[dow])
  return formatDateKey(target)
}

// ---------------------------------------------------------------------------
// Rule 3: Cover Given Limit (1 per calendar week)
// ---------------------------------------------------------------------------

export async function checkCoverGivenLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  adjDate: string
): Promise<RuleViolation | null> {
  const { weekStart, weekEnd } = getWeekBounds(adjDate)

  const { data } = await supabase
    .from('adjustments')
    .select('id, listing_type, creator_id, accepter_id, date, creator:profiles!creator_id(name), accepter:profiles!accepter_id(name)')
    .eq('type', 'COVER')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .in('status', ['CONFIRMED', 'PENDING_CONFIRMATION'])
    .or(`creator_id.eq.${userId},accepter_id.eq.${userId}`)

  const existingCoversGiven = (data ?? []).filter((adj: any) => {
    return (
      (adj.listing_type === 'REQUEST' && adj.accepter_id === userId) ||
      (adj.listing_type === 'OFFER' && adj.creator_id === userId)
    )
  })

  if (existingCoversGiven.length >= 1) {
    const existing = existingCoversGiven[0] as any
    const otherPartyName =
      existing.listing_type === 'REQUEST'
        ? existing.creator?.name
        : existing.accepter?.name
    const dateLabel = new Date(existing.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    return {
      rule: 'COVER_GIVEN_LIMIT',
      message: `You've already given 1 cover this week (${otherPartyName ? `for ${otherPartyName} ` : ''}on ${dateLabel}). The limit is 1 cover given per calendar week.`,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Rule 4: Cover Received Limit (5 per calendar month, CST)
// ---------------------------------------------------------------------------

export async function checkCoverReceivedLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  adjDate: string
): Promise<RuleViolation | null> {
  const { monthStart, monthEnd } = getMonthBoundsCST(adjDate)

  const { data, count } = await supabase
    .from('adjustments')
    .select('id, listing_type, creator_id, accepter_id', { count: 'exact' })
    .eq('type', 'COVER')
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .in('status', ['CONFIRMED', 'PENDING_CONFIRMATION'])
    .or(`creator_id.eq.${userId},accepter_id.eq.${userId}`)

  const existingCoversReceived = (data ?? []).filter((adj: any) => {
    return (
      (adj.listing_type === 'REQUEST' && adj.creator_id === userId) ||
      (adj.listing_type === 'OFFER' && adj.accepter_id === userId)
    )
  })

  const monthLabel = new Date(monthStart + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  if (existingCoversReceived.length >= 5) {
    return {
      rule: 'COVER_RECEIVED_LIMIT',
      message: `You've already used all 5 covers for ${monthLabel}. The limit is 5 covers requested per calendar month.`,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Rule 5: Swap Eligibility
// ---------------------------------------------------------------------------

/**
 * Both TPs must be scheduled to work on the swap date.
 * Neither can have it as an assigned day off.
 */
export async function checkSwapEligibility(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string,
  accepterId: string,
  adjDate: string,
  creatorScheduleMap: Map<DayOfWeek, Schedule>,
  accepterScheduleMap: Map<DayOfWeek, Schedule>
): Promise<RuleViolation | null> {
  const [y, m, d] = adjDate.split('-').map(Number)
  const adjDateObj = new Date(y, m - 1, d)
  const dow = jsDateToDayOfWeek(adjDateObj)

  const creatorDay = creatorScheduleMap.get(dow)
  const accepterDay = accepterScheduleMap.get(dow)

  if (!creatorDay || creatorDay.is_day_off) {
    return {
      rule: 'SWAP_ELIGIBILITY',
      message: `The listing creator is not scheduled to work on this date — it's one of their assigned days off. Swaps can only happen on days both TPs are scheduled to work.`,
    }
  }

  if (!accepterDay || accepterDay.is_day_off) {
    const dateLabel = adjDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    return {
      rule: 'SWAP_ELIGIBILITY',
      message: `You are not scheduled to work on ${dateLabel} — it's one of your assigned days off. Swaps can only happen on days both TPs are scheduled to work.`,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Main: validateAcceptance
// ---------------------------------------------------------------------------

/**
 * Run all applicable rule checks for a given user accepting a given listing.
 * Returns { valid: true } if all rules pass, or { valid: false, violations: [...] } otherwise.
 */
export async function validateAcceptance(
  listingId: string,
  accepterId: string
): Promise<ValidationResult> {
  const supabase = await createClient()

  // Fetch the listing
  const { data: adjData } = await supabase
    .from('adjustments')
    .select('*')
    .eq('id', listingId)
    .single()

  if (!adjData) {
    return { valid: false, violations: [{ rule: 'NOT_FOUND', message: 'Listing not found.' }] }
  }

  const adj = adjData as Adjustment

  // Fetch both parties' schedules in parallel
  const [accepterScheduleRes, creatorScheduleRes] = await Promise.all([
    supabase.from('schedules').select('*').eq('user_id', accepterId).order('effective_from', { ascending: false }),
    supabase.from('schedules').select('*').eq('user_id', adj.creator_id).order('effective_from', { ascending: false }),
  ])

  const accepterSchedule = (accepterScheduleRes.data ?? []) as Schedule[]
  const creatorSchedule = (creatorScheduleRes.data ?? []) as Schedule[]
  const accepterScheduleMap = buildScheduleMap(accepterSchedule)
  const creatorScheduleMap = buildScheduleMap(creatorSchedule)

  const violations: RuleViolation[] = []

  if (adj.type === 'SWAP') {
    // ---- Swap rules ----

    // Rule 5: Swap eligibility (both must be working, not a day off)
    const eligibilityViolation = await checkSwapEligibility(
      supabase,
      adj.creator_id,
      accepterId,
      adj.date,
      creatorScheduleMap,
      accepterScheduleMap
    )
    if (eligibilityViolation) violations.push(eligibilityViolation)

    // Rule 1: 8-hour rest for accepter (they work creator's shift times)
    if (!eligibilityViolation) {
      const accepterRestViolation = await checkRestBetweenShifts(
        supabase,
        accepterId,
        adj.date,
        adj.original_shift_start,
        adj.original_shift_end,
        accepterScheduleMap
      )
      if (accepterRestViolation) violations.push(accepterRestViolation)

      // Rule 1: 8-hour rest for creator (they work accepter's base shift times on adj.date)
      const [y, m, d] = adj.date.split('-').map(Number)
      const adjDateObj = new Date(y, m - 1, d)
      const dow = jsDateToDayOfWeek(adjDateObj)
      const accepterBaseDay = accepterScheduleMap.get(dow)

      if (accepterBaseDay && !accepterBaseDay.is_day_off && accepterBaseDay.shift_start && accepterBaseDay.shift_end) {
        const creatorRestViolation = await checkRestBetweenShifts(
          supabase,
          adj.creator_id,
          adj.date,
          accepterBaseDay.shift_start,
          accepterBaseDay.shift_end,
          creatorScheduleMap
        )
        if (creatorRestViolation) {
          // Rephrase to clarify it's about the creator
          violations.push({
            ...creatorRestViolation,
            message: `The listing creator would not have enough rest if this swap goes through: ${creatorRestViolation.message}`,
          })
        }
      }
    }
  } else {
    // ---- Cover rules ----

    const isAccepterGiving =
      (adj.listing_type === 'REQUEST') // Accepter covers the creator's shift
    const isCreatorGiving =
      (adj.listing_type === 'OFFER') // Creator offered to cover the accepter

    if (isAccepterGiving) {
      // Accepter is giving the cover

      // Rule 1: 8-hour rest for the accepter (they work the listed shift)
      const restViolation = await checkRestBetweenShifts(
        supabase,
        accepterId,
        adj.date,
        adj.original_shift_start,
        adj.original_shift_end,
        accepterScheduleMap
      )
      if (restViolation) violations.push(restViolation)

      // Rule 2: Weekly rest (accepter can't work both days off)
      const weeklyRestViolation = await checkWeeklyRest(
        supabase,
        accepterId,
        adj.date,
        accepterScheduleMap
      )
      if (weeklyRestViolation) violations.push(weeklyRestViolation)

      // Rule 3: Cover given limit for accepter (1/week)
      const coverGivenViolation = await checkCoverGivenLimit(supabase, accepterId, adj.date)
      if (coverGivenViolation) violations.push(coverGivenViolation)
    }

    if (isCreatorGiving) {
      // Creator is giving the cover — check their limits too

      // Rule 3: Cover given limit for creator (1/week)
      const creatorCoverGivenViolation = await checkCoverGivenLimit(supabase, adj.creator_id, adj.date)
      if (creatorCoverGivenViolation) {
        violations.push({
          ...creatorCoverGivenViolation,
          message: `The listing creator cannot fulfill this cover: ${creatorCoverGivenViolation.message}`,
        })
      }

      // Rule 4: Cover received limit for accepter (5/month)
      const coverReceivedViolation = await checkCoverReceivedLimit(supabase, accepterId, adj.date)
      if (coverReceivedViolation) violations.push(coverReceivedViolation)
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}

// ---------------------------------------------------------------------------
// Marketplace pre-filtering
// ---------------------------------------------------------------------------

/**
 * For a list of open listings, compute quick eligibility for the given user.
 * Uses pre-fetched user state to avoid N×5 DB queries.
 *
 * Returns each listing annotated with canAccept and any blocking violations.
 */
export async function getEligibleListings(
  userId: string,
  openListings: Adjustment[]
): Promise<Array<{ listing: Adjustment; canAccept: boolean; violations: RuleViolation[] }>> {
  if (openListings.length === 0) return []

  const supabase = await createClient()

  // Fetch user's schedule once
  const { data: scheduleData } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
    .order('effective_from', { ascending: false })

  const userSchedule = (scheduleData ?? []) as Schedule[]
  const userScheduleMap = buildScheduleMap(userSchedule)

  // Pre-fetch user's active adjustments for the coming 3 months (for covers given/received counts)
  const today = new Date()
  const threeMonthsLater = new Date(today)
  threeMonthsLater.setMonth(today.getMonth() + 3)
  const startStr = formatDateKey(today)
  const endStr = formatDateKey(threeMonthsLater)

  const { data: myAdjs } = await supabase
    .from('adjustments')
    .select('id, type, listing_type, creator_id, accepter_id, date, status')
    .gte('date', startStr)
    .lte('date', endStr)
    .in('status', ['CONFIRMED', 'PENDING_CONFIRMATION'])
    .or(`creator_id.eq.${userId},accepter_id.eq.${userId}`)

  const userActiveAdjs = (myAdjs ?? []) as Pick<
    Adjustment,
    'id' | 'type' | 'listing_type' | 'creator_id' | 'accepter_id' | 'date' | 'status'
  >[]

  return openListings.map((listing) => {
    const violations: RuleViolation[] = []
    const listingDate = listing.date

    if (listing.type === 'SWAP') {
      // Rule 5: Swap eligibility — user must be working on that date
      const [y, m, d] = listingDate.split('-').map(Number)
      const adjDateObj = new Date(y, m - 1, d)
      const dow = jsDateToDayOfWeek(adjDateObj)
      const userDay = userScheduleMap.get(dow)

      if (!userDay || userDay.is_day_off) {
        violations.push({
          rule: 'SWAP_ELIGIBILITY',
          message: `You are not scheduled to work on this date — it's one of your assigned days off.`,
        })
      }
    } else if (listing.type === 'COVER') {
      if (listing.listing_type === 'REQUEST') {
        // Accepter would give cover → check cover given limit (1/week)
        const { weekStart, weekEnd } = getWeekBounds(listingDate)
        const coversGivenThisWeek = userActiveAdjs.filter((a) => {
          if (a.type !== 'COVER') return false
          if (a.date < weekStart || a.date > weekEnd) return false
          return (
            (a.listing_type === 'REQUEST' && a.accepter_id === userId) ||
            (a.listing_type === 'OFFER' && a.creator_id === userId)
          )
        })
        if (coversGivenThisWeek.length >= 1) {
          const dateLabel = new Date(coversGivenThisWeek[0].date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric',
          })
          violations.push({
            rule: 'COVER_GIVEN_LIMIT',
            message: `You've already given 1 cover this week (on ${dateLabel}). Limit: 1/week.`,
          })
        }

        // Weekly rest: check if adj date is a day off and other day off is already worked
        const [y, m, d] = listingDate.split('-').map(Number)
        const adjDateObj = new Date(y, m - 1, d)
        const dow = jsDateToDayOfWeek(adjDateObj)
        const userDay = userScheduleMap.get(dow)

        if (userDay?.is_day_off) {
          // Check if other day off is already worked this week
          const { weekStart, weekEnd } = getWeekBounds(listingDate)
          const daysOff: DayOfWeek[] = Array.from(userScheduleMap.entries())
            .filter(([, s]) => s.is_day_off)
            .map(([d2]) => d2)
          const otherDow = daysOff.find((d2) => d2 !== dow)
          if (otherDow) {
            const otherDate = getDayOfWeekInWeek(weekStart, otherDow)
            const alreadyWorkingOtherDayOff = userActiveAdjs.some((a) => {
              if (a.type !== 'COVER' || a.date !== otherDate) return false
              return (
                (a.listing_type === 'REQUEST' && a.accepter_id === userId) ||
                (a.listing_type === 'OFFER' && a.creator_id === userId)
              )
            })
            if (alreadyWorkingOtherDayOff) {
              violations.push({
                rule: 'WEEKLY_REST',
                message: `Accepting this would mean working both of your days off this week.`,
              })
            }
          }
        }
      } else if (listing.listing_type === 'OFFER') {
        // Accepter would receive cover → check cover received limit (5/month)
        const { monthStart, monthEnd } = getMonthBoundsCST(listingDate)
        const coversReceivedThisMonth = userActiveAdjs.filter((a) => {
          if (a.type !== 'COVER') return false
          if (a.date < monthStart || a.date > monthEnd) return false
          return (
            (a.listing_type === 'REQUEST' && a.creator_id === userId) ||
            (a.listing_type === 'OFFER' && a.accepter_id === userId)
          )
        })
        if (coversReceivedThisMonth.length >= 5) {
          violations.push({
            rule: 'COVER_RECEIVED_LIMIT',
            message: `You've used all 5 covers for this month. Limit: 5/month.`,
          })
        }
      }
    }

    return {
      listing,
      canAccept: violations.length === 0,
      violations,
    }
  })
}

// ---------------------------------------------------------------------------
// Formatting helper (local, not exported)
// ---------------------------------------------------------------------------
function fmtTime(t: string): string {
  const [h, min] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${h12}:${min} ${ampm}`
}
