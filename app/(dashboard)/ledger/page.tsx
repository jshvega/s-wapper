import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LedgerList } from '@/components/ledger/ledger-list'
import { HandCoins, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { LedgerEntry } from '@/lib/types'

export default async function LedgerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Profile + adjustment join select strings
  const profileJoins = 'creditor:profiles!creditor_id(id, name, email), debtor:profiles!debtor_id(id, name, email)'
  // Full join includes aspect_trade_id (requires migration 010)
  const adjJoinFull = `${profileJoins}, adjustment:adjustments!adjustment_id(id, type, listing_type, date, original_shift_start, original_shift_end, aspect_trade_id, confirmed_at, status)`
  // Fallback join omits aspect_trade_id (works even without migration 010)
  const adjJoinBasic = `${profileJoins}, adjustment:adjustments!adjustment_id(id, type, listing_type, date, original_shift_start, original_shift_end, confirmed_at, status)`

  // .select() must come before .or()/.order() in the Supabase JS client
  const query = (selectStr: string) =>
    supabase
      .from('ledger_entries')
      .select(`*, ${selectStr}`)
      .or(`creditor_id.eq.${user.id},debtor_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

  // Try full join first, fall back to basic join, then profiles-only as last resort
  let ledger: LedgerEntry[]
  const { data: entries, error: ledgerError } = await query(adjJoinFull)

  if (ledgerError) {
    console.error('[LEDGER_PAGE] Full query error:', ledgerError.message)
    const { data: basicEntries, error: basicError } = await query(adjJoinBasic)

    if (basicError) {
      console.error('[LEDGER_PAGE] Basic join query also failed:', basicError.message)
      // Last resort: profiles only, no adjustment join
      const { data: profilesOnly } = await supabase
        .from('ledger_entries')
        .select(`*, ${profileJoins}`)
        .or(`creditor_id.eq.${user.id},debtor_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      ledger = (profilesOnly ?? []) as unknown as LedgerEntry[]
    } else {
      console.log('[LEDGER_PAGE] Basic join returned', basicEntries?.length, 'entries')
      ledger = (basicEntries ?? []) as unknown as unknown as LedgerEntry[]
    }
  } else {
    console.log('[LEDGER_PAGE] Full query returned', entries?.length, 'entries')
    ledger = (entries ?? []) as unknown as LedgerEntry[]
  }

  // Filter out entries whose adjustment was cancelled/removed — those debts no longer exist
  const activeLedger = ledger.filter((e) => {
    const adjStatus = (e.adjustment as any)?.status
    // Keep if no adjustment data (legacy/fallback) or if adjustment is still CONFIRMED
    if (!adjStatus) return true
    return adjStatus === 'CONFIRMED'
  })

  // Split into owed-to-me (I'm the creditor) and I-owe (I'm the debtor)
  const owedToMe = activeLedger.filter((e) => e.creditor_id === user.id)
  const iOwe = activeLedger.filter((e) => e.debtor_id === user.id)

  const owedToMeUnsettled = owedToMe.filter((e) => !e.is_settled).length
  const iOweUnsettled = iOwe.filter((e) => !e.is_settled).length

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HandCoins className="h-6 w-6 text-purple-600" />
          Ledger
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track cover obligations between you and other TPs.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <ArrowDownLeft className="h-5 w-5 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-teal-600">{owedToMeUnsettled}</p>
            <p className="text-xs text-gray-500 mt-0.5">Covers owed to you</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <ArrowUpRight className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{iOweUnsettled}</p>
            <p className="text-xs text-gray-500 mt-0.5">Covers you owe</p>
          </CardContent>
        </Card>
      </div>

      {/* People who owe you */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          People Who Owe You
          {owedToMeUnsettled > 0 && (
            <Badge variant="teal">{owedToMeUnsettled}</Badge>
          )}
        </h2>
        <LedgerList
          entries={owedToMe}
          currentUserId={user.id}
          type="owed_to_you"
        />
      </div>

      {/* People you owe */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          People You Owe
          {iOweUnsettled > 0 && (
            <Badge variant="warning">{iOweUnsettled}</Badge>
          )}
        </h2>
        <LedgerList
          entries={iOwe}
          currentUserId={user.id}
          type="you_owe"
        />
      </div>
    </div>
  )
}
