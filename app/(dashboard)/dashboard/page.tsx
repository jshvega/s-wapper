import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get this week's schedule
  const today = new Date()
  const dayNames: Record<number, string> = {
    0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
  }

  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('effective_from', { ascending: false })

  // Get pending confirmations for this user
  const { data: pendingAdjustments } = await supabase
    .from('adjustments')
    .select('*, creator:profiles!creator_id(name), accepter:profiles!accepter_id(name)')
    .eq('status', 'PENDING_CONFIRMATION')
    .or(`creator_id.eq.${user.id},accepter_id.eq.${user.id}`)
    .order('expires_at', { ascending: true })

  // Get open marketplace count
  const { count: openCount } = await supabase
    .from('adjustments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'OPEN')
    .neq('creator_id', user.id)

  // Get ledger summary
  const { data: ledgerOwed } = await supabase
    .from('ledger_entries')
    .select('id')
    .eq('debtor_id', user.id)
    .eq('is_settled', false)

  const { data: ledgerOwedToMe } = await supabase
    .from('ledger_entries')
    .select('id')
    .eq('creditor_id', user.id)
    .eq('is_settled', false)

  // Build weekly strip
  const weekDays = []
  const startOfWeek = new Date(today)
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startOfWeek.setDate(today.getDate() + mondayOffset)

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    const dayKey = dayNames[date.getDay()]
    const schedule = schedules?.find((s) => s.day_of_week === dayKey)
    const isToday = date.toDateString() === today.toDateString()
    weekDays.push({ date, dayKey, schedule, isToday })
  }

  const DAY_LABELS: Record<string, string> = {
    MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
  }

  function formatTime(time: string | null) {
    if (!time) return null
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${hour12}:${m}${ampm}`
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {profile?.name?.split(' ')[0]}
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
          <CardTitle className="text-base">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(({ date, dayKey, schedule, isToday }) => (
              <div
                key={dayKey}
                className={`flex flex-col items-center p-2 rounded-lg text-center ${
                  isToday ? 'bg-blue-50 ring-2 ring-blue-400' : ''
                } ${schedule?.is_day_off ? 'bg-blue-50' : ''}`}
              >
                <span className="text-xs font-medium text-gray-500">{DAY_LABELS[dayKey]}</span>
                <span className={`text-lg font-bold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </span>
                {schedule?.is_day_off ? (
                  <span className="text-xs text-blue-600 mt-1">OFF</span>
                ) : schedule ? (
                  <span className="text-xs text-gray-500 mt-1 leading-tight">
                    {formatTime(schedule.shift_start)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300 mt-1">—</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{openCount ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Open Listings</p>
            <Link href="/marketplace" className="text-xs text-blue-600 hover:underline mt-1 block">
              View
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingAdjustments?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{ledgerOwed?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Covers Owed</p>
            <Link href="/ledger" className="text-xs text-blue-600 hover:underline mt-1 block">
              View
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations */}
      {pendingAdjustments && pendingAdjustments.length > 0 && (
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
                <div key={adj.id} className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 border-amber-200">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="warning">{adj.type}</Badge>
                      <span className="text-sm font-medium">
                        {isCreator ? 'Your listing' : `From ${(adj.creator as any)?.name}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(adj.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {hoursLeft !== null && ` · ${hoursLeft}h remaining`}
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
