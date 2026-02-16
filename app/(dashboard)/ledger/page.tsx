import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const { data: entries } = await supabase
    .from('ledger_entries')
    .select(
      '*, creditor:profiles!creditor_id(id, name, email), debtor:profiles!debtor_id(id, name, email), adjustment:adjustments!adjustment_id(id, type, listing_type, date, original_shift_start, original_shift_end, aspect_track_id, confirmed_at)'
    )
    .or(`creditor_id.eq.${user.id},debtor_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const ledger = (entries ?? []) as LedgerEntry[]

  // Split into owed-to-me (I'm the creditor) and I-owe (I'm the debtor)
  const owedToMe = ledger.filter((e) => e.creditor_id === user.id)
  const iOwe = ledger.filter((e) => e.debtor_id === user.id)

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
