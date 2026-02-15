import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WeeklyStrip } from '@/components/calendar/weekly-strip'
import { calculateEffectiveSchedule } from '@/lib/utils/schedule'
import { getWeekDates, formatDateKey } from '@/lib/utils/dates'
import { Plus, Clock, CheckCircle } from 'lucide-react'
import type { Schedule, Adjustment } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date()
  const weekDates = getWeekDates(today)
  const weekStart = formatDateKey(weekDates[0])
  const weekEnd = formatDateKey(weekDates[6])

  const [
    profileRes,
    schedulesRes,
    pendingRes,
    weekAdjRes,
    openCountRes,
    ledgerOwedRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('effective_from', { ascending: false }),
    supabase
      .from('adjustments')
      .select('*, creator:profiles!creator_id(id,name), accepter:profiles!accepter_id(id,name)')
      .eq('status', 'PENDING_CONFIRMATION')
      .or(`creator_id.eq.${user.id},accepter_id.eq.${user.id}`)
      .order('expires_at', { ascending: true }),
    supabase
      .from('adjustments')
      .select('*, creator:profiles!creator_id(id,name), accepter:profiles!accepter_id(id,name)')
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .or(`creator_id.eq.${user.id},accepter_id.eq.${user.id}`)
      .in('status', ['DRAFT', 'OPEN', 'PENDING_CONFIRMATION', 'CONFIRMED']),
    supabase
      .from('adjustments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'OPEN')
      .neq('creator_id', user.id),
    supabase
      .from('ledger_entries')
      .select('id')
      .eq('debtor_id', user.id)
      .eq('is_settled', false),
  ])

  const profile = profileRes.data
  const schedules = (schedulesRes.data ?? []) as Schedule[]
  const pendingAdjustments = pendingRes.data ?? []
  const weekAdjustments = (weekAdjRes.data ?? []) as Adjustment[]
  const openCount = openCountRes.count ?? 0
  const ledgerOwed = ledgerOwedRes.data ?? []

  // Compute effective shifts for the weekly strip
  const effectiveShifts = calculateEffectiveSchedule(
    user.id,
    schedules,
    weekAdjustments,
    { start: weekDates[0], end: weekDates[6] }
  )

  const greeting =
    today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {greeting}, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/listings/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {/* Weekly Strip */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">This Week</CardTitle>
            <Link href="/calendar" className="text-xs text-blue-600 hover:underline">
              Full calendar →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <WeeklyStrip
            effectiveShifts={effectiveShifts}
            weekDates={weekDates}
            today={today}
          />
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{openCount}</p>
            <p className="text-xs text-gray-500 mt-1">Open Listings</p>
            <Link href="/marketplace" className="text-xs text-blue-600 hover:underline mt-1 block">
              View
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingAdjustments.length}</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{ledgerOwed.length}</p>
            <p className="text-xs text-gray-500 mt-1">Covers Owed</p>
            <Link href="/ledger" className="text-xs text-blue-600 hover:underline mt-1 block">
              View
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations */}
      {pendingAdjustments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Awaiting Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAdjustments.map((adj) => {
              const expiresAt = adj.expires_at ? new Date(adj.expires_at) : null
              const hoursLeft = expiresAt
                ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 3600000))
                : null
              const isCreator = adj.creator_id === user.id

              return (
                <div
                  key={adj.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 border-amber-200"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="warning">{adj.type}</Badge>
                      <span className="text-sm font-medium">
                        {isCreator ? 'Your listing' : `From ${(adj.creator as any)?.name}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(adj.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {hoursLeft !== null && (
                        <span className={hoursLeft < 4 ? ' text-red-500 font-medium' : ''}>
                          {' '}· {hoursLeft}h remaining
                        </span>
                      )}
                    </p>
                  </div>
                  <Link href={`/listings/${adj.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Enter Track ID
                    </Button>
                  </Link>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Link href="/listings/new">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
              <Plus className="h-4 w-4 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium">Create Listing</p>
                <p className="text-xs text-gray-500">Request or offer a swap/cover</p>
              </div>
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium">Browse Market</p>
                <p className="text-xs text-gray-500">Find swaps & covers to accept</p>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
