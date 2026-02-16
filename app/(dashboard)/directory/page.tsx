import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DirectoryList } from '@/components/directory/directory-list'
import { Users } from 'lucide-react'
import type { Profile, Schedule, DayOfWeek } from '@/lib/types'

const DAY_ORDER: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export interface DirectoryEntry {
  profile: Profile
  schedule: Record<DayOfWeek, { is_day_off: boolean; shift_start: string | null; shift_end: string | null }>
}

export default async function DirectoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all active profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Fetch the latest schedules for all users.
  // We need the most recent effective_from set per user.
  const { data: allSchedules } = await supabase
    .from('schedules')
    .select('*')
    .order('effective_from', { ascending: false })

  const schedulesByUser = new Map<string, Schedule[]>()
  for (const s of (allSchedules ?? []) as Schedule[]) {
    if (!schedulesByUser.has(s.user_id)) {
      schedulesByUser.set(s.user_id, [])
    }
    schedulesByUser.get(s.user_id)!.push(s)
  }

  // Build directory entries: for each user, pick their latest schedule set
  const entries: DirectoryEntry[] = (profiles ?? []).map((p) => {
    const userSchedules = schedulesByUser.get(p.id) ?? []

    // Latest effective_from date
    const latestDate = userSchedules[0]?.effective_from
    const latestSet = latestDate
      ? userSchedules.filter((s) => s.effective_from === latestDate)
      : []

    // Build a day-of-week map
    const schedule = {} as DirectoryEntry['schedule']
    for (const day of DAY_ORDER) {
      const match = latestSet.find((s) => s.day_of_week === day)
      schedule[day] = match
        ? { is_day_off: match.is_day_off, shift_start: match.shift_start, shift_end: match.shift_end }
        : { is_day_off: true, shift_start: null, shift_end: null }
    }

    return { profile: p as Profile, schedule }
  })

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Directory
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {entries.length} active TP{entries.length !== 1 ? 's' : ''}
        </p>
      </div>

      <DirectoryList entries={entries} currentUserId={user.id} />
    </div>
  )
}
