'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createListing, publishListing } from '@/lib/actions/listings'
import { jsDateToDayOfWeek, timeToInputValue, formatTime } from '@/lib/utils/dates'
import { useToast } from '@/hooks/use-toast'
import type { Schedule, AdjustmentType, ListingType } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ListingFormProps {
  schedule: Schedule[]
  bidPeriod?: { name: string; start_date: string; end_date: string } | null
}

function getScheduleForDate(schedule: Schedule[], date: string): Schedule | null {
  if (!date) return null
  const d = new Date(date + 'T00:00:00')
  const dow = jsDateToDayOfWeek(d)
  // Get most recent effective schedule for that day
  const matches = schedule
    .filter((s) => s.day_of_week === dow)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from))
  return matches[0] ?? null
}

export function ListingForm({ schedule, bidPeriod }: ListingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('COVER')
  const [listingType, setListingType] = useState<ListingType>('REQUEST')
  const [date, setDate] = useState('')
  const [desiredStart, setDesiredStart] = useState('')
  const [desiredEnd, setDesiredEnd] = useState('')
  const [notes, setNotes] = useState('')

  const daySchedule = getScheduleForDate(schedule, date)
  const isDayOff = daySchedule?.is_day_off ?? false
  const autoStart = daySchedule && !isDayOff ? timeToInputValue(daySchedule.shift_start!) : ''
  const autoEnd = daySchedule && !isDayOff ? timeToInputValue(daySchedule.shift_end!) : ''

  const showDesiredTime = adjustmentType === 'SWAP' && listingType === 'REQUEST'

  const handleSave = (andPublish: boolean) => {
    if (!date) {
      toast({ title: 'Date required', description: 'Please select a date.', variant: 'destructive' })
      return
    }
    if (bidPeriod && (date < bidPeriod.start_date || date > bidPeriod.end_date)) {
      const fmt = (d: string) =>
        new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      toast({
        title: 'Date outside bid period',
        description: `This date is outside the current bid period (${fmt(bidPeriod.start_date)} – ${fmt(bidPeriod.end_date)}).`,
        variant: 'destructive',
      })
      return
    }
    if (isDayOff) {
      toast({
        title: 'Day off selected',
        description: 'You have a day off on this date. You cannot list it unless you already have coverage.',
        variant: 'destructive',
      })
      return
    }
    if (!autoStart || !autoEnd) {
      toast({ title: 'No schedule found', description: 'No shift scheduled for this date.', variant: 'destructive' })
      return
    }
    if (showDesiredTime && (!desiredStart || !desiredEnd)) {
      toast({
        title: 'Desired shift required',
        description: 'Please enter the shift times you want in return.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await createListing({
        type: adjustmentType,
        listing_type: listingType,
        date,
        original_shift_start: autoStart,
        original_shift_end: autoEnd,
        desired_shift_start: showDesiredTime ? desiredStart : undefined,
        desired_shift_end: showDesiredTime ? desiredEnd : undefined,
        notes: notes.trim() || undefined,
      })

      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }

      if (andPublish && result.data) {
        const publishResult = await publishListing(result.data.id)
        if (publishResult.error) {
          toast({ title: 'Saved as draft', description: 'Created but could not publish: ' + publishResult.error })
          router.push('/listings')
          return
        }
        toast({ title: 'Published!', description: 'Your listing is now live in the marketplace.' })
      } else {
        toast({ title: 'Saved as draft', description: 'You can publish it from My Listings.' })
      }

      router.push('/listings')
    })
  }

  // Today's date in YYYY-MM-DD for min date
  const todayStr = new Date().toISOString().split('T')[0]
  const minDate = bidPeriod ? (bidPeriod.start_date > todayStr ? bidPeriod.start_date : todayStr) : todayStr
  const maxDate = bidPeriod?.end_date

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/listings">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Listing</h1>
          <p className="text-sm text-gray-500">Request or offer a swap or cover</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Adjustment Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Adjustment Type</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(['SWAP', 'COVER'] as AdjustmentType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAdjustmentType(t)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  adjustmentType === t
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm">{t}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t === 'SWAP'
                    ? 'Trade shifts — you work their shift, they work yours'
                    : 'One-way — they cover your shift, you owe them one'}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Listing Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">I am…</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(['REQUEST', 'OFFER'] as ListingType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setListingType(t)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  listingType === t
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm">{t === 'REQUEST' ? 'Requesting' : 'Offering'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t === 'REQUEST'
                    ? adjustmentType === 'SWAP'
                      ? 'Looking for someone to swap with me'
                      : 'Need someone to cover my shift'
                    : adjustmentType === 'SWAP'
                    ? 'Offering to swap with someone'
                    : 'Willing to cover someone else'}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bidPeriod && (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                Active bid period: <span className="font-medium">{bidPeriod.name}</span>{' '}
                ({new Date(bidPeriod.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(bidPeriod.end_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
              </p>
            )}
            <div>
              <Input
                type="date"
                min={minDate}
                max={maxDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {date && (
              <div className="rounded-lg bg-gray-50 border p-3">
                {isDayOff ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="info">Day Off</Badge>
                    <span className="text-sm text-gray-600">You are scheduled off on this date</span>
                  </div>
                ) : daySchedule ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Your Shift</Badge>
                    <span className="text-sm font-medium">
                      {formatTime(daySchedule.shift_start!)} – {formatTime(daySchedule.shift_end!)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No schedule found for this date</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Desired Shift (swap requests only) */}
        {showDesiredTime && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Desired Shift in Return</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 mb-3">
                What shift times are you looking for in exchange?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="desired-start" className="text-xs">Start Time</Label>
                  <Input
                    id="desired-start"
                    type="time"
                    value={desiredStart}
                    onChange={(e) => setDesiredStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desired-end" className="text-xs">End Time</Label>
                  <Input
                    id="desired-end"
                    type="time"
                    value={desiredEnd}
                    onChange={(e) => setDesiredEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Notes (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional details, preferences, or context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{notes.length}/500</p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="flex-1"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? 'Saving…' : 'Publish Now'}
          </Button>
        </div>
      </div>
    </div>
  )
}
