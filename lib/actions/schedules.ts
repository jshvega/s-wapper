'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SetupScheduleInput } from '@/lib/types'

export async function setupSchedule(input: SetupScheduleInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { days } = input

  // Validate: exactly 2 days off
  const daysOff = days.filter((d) => d.is_day_off)
  if (daysOff.length !== 2) {
    return { error: 'You must have exactly 2 days off per week.' }
  }

  // Validate: all workdays have shift times
  const workdays = days.filter((d) => !d.is_day_off)
  for (const day of workdays) {
    if (!day.shift_start || !day.shift_end) {
      return { error: `Shift start and end times are required for ${day.day_of_week}.` }
    }
  }

  // Delete existing schedules for this user (replace approach)
  await supabase.from('schedules').delete().eq('user_id', user.id)

  // Insert new schedule
  const rows = days.map((day) => ({
    user_id: user.id,
    day_of_week: day.day_of_week,
    shift_start: day.is_day_off ? null : day.shift_start,
    shift_end: day.is_day_off ? null : day.shift_end,
    is_day_off: day.is_day_off,
    effective_from: new Date().toISOString().split('T')[0],
  }))

  const { error } = await supabase.from('schedules').insert(rows)

  if (error) {
    console.error('Schedule insert error:', error)
    return { error: 'Failed to save schedule. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath('/settings')

  return { success: true }
}

export async function getMySchedule() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('effective_from', { ascending: false })

  return data
}
