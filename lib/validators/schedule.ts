import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const workdaySchema = z.object({
  day_of_week: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  is_day_off: z.literal(false),
  shift_start: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
  shift_end: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
})

const dayOffSchema = z.object({
  day_of_week: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  is_day_off: z.literal(true),
  shift_start: z.undefined().optional(),
  shift_end: z.undefined().optional(),
})

const scheduleDaySchema = z.discriminatedUnion('is_day_off', [workdaySchema, dayOffSchema])

export const setupScheduleSchema = z
  .object({
    days: z.array(scheduleDaySchema).length(7, 'Must provide exactly 7 days'),
  })
  .refine(
    (data) => {
      const daysOff = data.days.filter((d) => d.is_day_off)
      return daysOff.length === 2
    },
    { message: 'Exactly 2 days off are required per week', path: ['days'] }
  )
  .refine(
    (data) => {
      // All 7 days must be represented
      const days = data.days.map((d) => d.day_of_week)
      const required = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
      return required.every((d) => days.includes(d as any))
    },
    { message: 'All 7 days of the week must be included', path: ['days'] }
  )

export type SetupScheduleSchema = z.infer<typeof setupScheduleSchema>
