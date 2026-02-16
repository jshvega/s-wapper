import { NextRequest, NextResponse } from 'next/server'
import { sendShiftReminders } from '@/lib/utils/shift-reminders'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/shift-reminders
 *
 * Daily cron job (intended to run at ~6pm) that sends reminders
 * to users with confirmed adjustments for the next day.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendShiftReminders()

  return NextResponse.json(result)
}
