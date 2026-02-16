'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SettleDialog } from './settle-dialog'
import { formatTime } from '@/lib/utils/dates'
import { ChevronDown, ChevronRight, CheckCircle2, User, RefreshCw } from 'lucide-react'
import type { LedgerEntry, Profile } from '@/lib/types'

interface GroupedEntries {
  person: Profile
  unsettled: LedgerEntry[]
  settled: LedgerEntry[]
  total: number
  unsettledCount: number
}

interface LedgerListProps {
  entries: LedgerEntry[]
  currentUserId: string
  type: 'owed_to_you' | 'you_owe'
}

function groupByPerson(entries: LedgerEntry[], currentUserId: string, type: 'owed_to_you' | 'you_owe'): GroupedEntries[] {
  const map = new Map<string, GroupedEntries>()

  for (const entry of entries) {
    const person = type === 'owed_to_you' ? entry.debtor : entry.creditor
    if (!person) continue

    if (!map.has(person.id)) {
      map.set(person.id, {
        person,
        unsettled: [],
        settled: [],
        total: 0,
        unsettledCount: 0,
      })
    }

    const group = map.get(person.id)!
    group.total++
    if (entry.is_settled) {
      group.settled.push(entry)
    } else {
      group.unsettled.push(entry)
      group.unsettledCount++
    }
  }

  // Sort by unsettled count descending
  return Array.from(map.values()).sort((a, b) => b.unsettledCount - a.unsettledCount)
}

function settlementLabel(type: string | null): string {
  switch (type) {
    case 'COVER_RETURNED': return 'Cover Returned'
    case 'CASH': return 'Cash'
    case 'FORGIVEN': return 'Forgiven'
    default: return 'Unknown'
  }
}

export function LedgerList({ entries, currentUserId, type }: LedgerListProps) {
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set())
  const [settleEntry, setSettleEntry] = useState<LedgerEntry | null>(null)

  const groups = groupByPerson(entries, currentUserId, type)

  if (groups.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        {type === 'owed_to_you' ? 'No one owes you covers.' : 'You don\'t owe anyone covers.'}
      </p>
    )
  }

  function toggleExpand(personId: string) {
    setExpandedPersons((prev) => {
      const next = new Set(prev)
      if (next.has(personId)) {
        next.delete(personId)
      } else {
        next.add(personId)
      }
      return next
    })
  }

  return (
    <>
      <div className="space-y-2">
        {groups.map((group) => {
          const isExpanded = expandedPersons.has(group.person.id)

          return (
            <Card key={group.person.id}>
              <CardContent className="pt-3 pb-3">
                {/* Person header */}
                <button
                  onClick={() => toggleExpand(group.person.id)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {group.person.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {group.unsettledCount > 0
                          ? `${group.unsettledCount} cover${group.unsettledCount !== 1 ? 's' : ''} outstanding`
                          : 'All settled'}
                        {group.settled.length > 0 &&
                          ` · ${group.settled.length} settled`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.unsettledCount > 0 && (
                      <Badge variant={type === 'owed_to_you' ? 'teal' : 'warning'}>
                        {group.unsettledCount}
                      </Badge>
                    )}
                    {group.unsettledCount === 0 && (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Settled
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded entries */}
                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    {/* Unsettled entries */}
                    {group.unsettled.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        canSettle={true}
                        onSettle={() => setSettleEntry(entry)}
                      />
                    ))}

                    {/* Settled entries */}
                    {group.settled.length > 0 && group.unsettled.length > 0 && (
                      <Separator className="my-2" />
                    )}
                    {group.settled.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        canSettle={false}
                        onSettle={() => {}}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SettleDialog
        entry={settleEntry}
        open={settleEntry !== null}
        onOpenChange={(open) => {
          if (!open) setSettleEntry(null)
        }}
        currentUserId={currentUserId}
      />
    </>
  )
}

function EntryRow({
  entry,
  canSettle,
  onSettle,
}: {
  entry: LedgerEntry
  canSettle: boolean
  onSettle: () => void
}) {
  const adjDate = entry.adjustment?.date
    ? new Date(entry.adjustment.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown'

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-md text-sm ${
        entry.is_settled ? 'bg-gray-50 text-gray-400' : 'bg-white'
      }`}
    >
      <div className="space-y-0.5">
        <p className={entry.is_settled ? 'line-through' : 'text-gray-700'}>
          {adjDate}
          {entry.adjustment?.original_shift_start && (
            <span className="text-xs text-gray-400 ml-1.5">
              {formatTime(entry.adjustment.original_shift_start)} –{' '}
              {formatTime(entry.adjustment.original_shift_end)}
            </span>
          )}
        </p>
        {entry.is_settled && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            {entry.auto_reconciled && (
              <RefreshCw className="h-3 w-3 text-blue-400 shrink-0" />
            )}
            {entry.auto_reconciled ? 'Auto-reconciled' : settlementLabel(entry.settlement_type)}
            {' · '}
            {entry.settled_at
              ? new Date(entry.settled_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : ''}
          </p>
        )}
        {entry.adjustment?.aspect_track_id && !entry.is_settled && (
          <p className="text-xs text-gray-400">
            Track: {entry.adjustment.aspect_track_id}
          </p>
        )}
      </div>

      {canSettle && !entry.is_settled && (
        <Button size="sm" variant="outline" onClick={onSettle} className="text-xs h-7">
          Settle
        </Button>
      )}
      {entry.is_settled && (
        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
      )}
    </div>
  )
}
