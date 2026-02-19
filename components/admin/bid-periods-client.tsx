'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  createBidPeriod,
  setActiveBidPeriod,
  deactivateBidPeriod,
  deleteBidPeriod,
} from '@/lib/actions/admin'
import type { BidPeriod } from '@/lib/types'
import { CalendarDays, CheckCircle, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  bidPeriods: BidPeriod[]
}

export function BidPeriodsClient({ bidPeriods }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New bid period form state
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showForm, setShowForm] = useState(false)

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setError(null) }
    else { setError(msg); setSuccess(null) }
    setTimeout(() => { setSuccess(null); setError(null) }, 4000)
  }

  const handleCreate = () => {
    setError(null)
    startTransition(async () => {
      const result = await createBidPeriod(name, startDate, endDate)
      if (result.error) { flash(result.error, 'error'); return }
      flash('Bid period created.', 'success')
      setName(''); setStartDate(''); setEndDate(''); setShowForm(false)
      router.refresh()
    })
  }

  const handleSetActive = (id: string) => {
    startTransition(async () => {
      const result = await setActiveBidPeriod(id)
      if (result.error) { flash(result.error, 'error'); return }
      flash('Bid period set as active.', 'success')
      router.refresh()
    })
  }

  const handleDeactivate = (id: string) => {
    startTransition(async () => {
      const result = await deactivateBidPeriod(id)
      if (result.error) { flash(result.error, 'error'); return }
      flash('Bid period deactivated.', 'success')
      router.refresh()
    })
  }

  const handleDelete = (id: string, periodName: string) => {
    if (!confirm(`Delete bid period "${periodName}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteBidPeriod(id)
      if (result.error) { flash(result.error, 'error'); return }
      flash('Bid period deleted.', 'success')
      router.refresh()
    })
  }

  const activePeriod = bidPeriods.find(p => p.is_active)

  return (
    <div className="space-y-6">
      {/* Status messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">{success}</div>
      )}

      {/* Active period banner */}
      {activePeriod ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Active: {activePeriod.name}</p>
            <p className="text-xs text-blue-700">
              {activePeriod.start_date} → {activePeriod.end_date}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            No active bid period. The calendar will default to the current week.
          </p>
        </div>
      )}

      {/* Bid period list */}
      <div className="space-y-3">
        {bidPeriods.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm border rounded-lg bg-white">
            No bid periods yet. Create one below.
          </div>
        )}
        {bidPeriods.map((period) => (
          <Card key={period.id} className={period.is_active ? 'border-blue-300 bg-blue-50/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{period.name}</span>
                    {period.is_active && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(period.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {' → '}
                    {new Date(period.end_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {period.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(period.id)}
                      disabled={isPending}
                      className="text-gray-600"
                    >
                      <ToggleLeft className="h-4 w-4 mr-1" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(period.id)}
                      disabled={isPending}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <ToggleRight className="h-4 w-4 mr-1" />
                      Set Active
                    </Button>
                  )}
                  {!period.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(period.id, period.name)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Create new bid period */}
      {showForm ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Bid Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bp-name">Name</Label>
              <Input
                id="bp-name"
                placeholder="e.g., March 2026 Bid"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bp-start">Start Date</Label>
                <Input
                  id="bp-start"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bp-end">End Date</Label>
                <Input
                  id="bp-end"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleCreate}
                disabled={isPending || !name.trim() || !startDate || !endDate}
              >
                Create Bid Period
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Bid Period
        </Button>
      )}
    </div>
  )
}
