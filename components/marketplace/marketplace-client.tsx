'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/marketplace/listing-card'
import { AcceptDialog } from '@/components/marketplace/accept-dialog'
import { createClient } from '@/lib/supabase/client'
import { Search, Store } from 'lucide-react'
import type { Adjustment, AdjustmentType, ListingType, RuleViolation } from '@/lib/types'

type EligibilityEntry = {
  listing: Adjustment
  canAccept: boolean
  violations: RuleViolation[]
}

interface MarketplaceClientProps {
  initialListings: Adjustment[]
  eligibilityMap: EligibilityEntry[]
  currentUserId: string
}

type TypeFilter = AdjustmentType | 'ALL'
type ListingTypeFilter = ListingType | 'ALL'

export function MarketplaceClient({
  initialListings,
  eligibilityMap,
  currentUserId,
}: MarketplaceClientProps) {
  const [listings, setListings] = useState<Adjustment[]>(initialListings)
  // eligibility keyed by listing id — starts from SSR data, not refreshed on realtime
  // (re-running validation client-side on realtime updates would require server calls;
  //  instead we refresh the whole page which re-runs server-side eligibility check)
  const [eligibility] = useState<Map<string, EligibilityEntry>>(
    () => new Map(eligibilityMap.map((e) => [e.listing.id, e]))
  )
  const [selectedAdj, setSelectedAdj] = useState<Adjustment | null>(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [listingTypeFilter, setListingTypeFilter] = useState<ListingTypeFilter>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showOnlyEligible, setShowOnlyEligible] = useState(false)

  // Real-time subscription — re-fetch listings when marketplace changes
  const supabase = createClient()

  const fetchListings = useCallback(async () => {
    const { data } = await supabase
      .from('adjustments')
      .select('*, creator:profiles!creator_id(id, name)')
      .eq('status', 'OPEN')
      .neq('creator_id', currentUserId)
      .order('date', { ascending: true })
    if (data) setListings(data as Adjustment[])
  }, [currentUserId])

  useEffect(() => {
    const channel = supabase
      .channel('marketplace-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'adjustments' },
        () => {
          fetchListings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchListings])

  // Filtered listings
  const filtered = listings.filter((adj) => {
    if (typeFilter !== 'ALL' && adj.type !== typeFilter) return false
    if (listingTypeFilter !== 'ALL' && adj.listing_type !== listingTypeFilter) return false
    if (dateFrom && adj.date < dateFrom) return false
    if (dateTo && adj.date > dateTo) return false
    if (showOnlyEligible) {
      const e = eligibility.get(adj.id)
      if (e && !e.canAccept) return false
    }
    return true
  })

  const ineligibleCount = listings.filter((adj) => {
    const e = eligibility.get(adj.id)
    return e && !e.canAccept
  }).length

  const todayStr = new Date().toISOString().split('T')[0]
  const selectedEligibility = selectedAdj ? eligibility.get(selectedAdj.id) : undefined

  const hasFilters = typeFilter !== 'ALL' || listingTypeFilter !== 'ALL' || dateFrom || dateTo || showOnlyEligible

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-5">
        {/* Type filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'SWAP', 'COVER'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              aria-pressed={typeFilter === t}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                typeFilter === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}

          <div className="w-px bg-gray-200 mx-1" aria-hidden="true" />

          {(['ALL', 'REQUEST', 'OFFER'] as ListingTypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setListingTypeFilter(t)}
              aria-pressed={listingTypeFilter === t}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                listingTypeFilter === t
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'REQUEST' ? 'Needs Help' : 'Offering'}
            </button>
          ))}
        </div>

        {/* Date range + eligible only */}
        <div className="flex items-center gap-2 flex-wrap">
          <Search className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
          <Input
            type="date"
            min={todayStr}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 text-sm max-w-[150px]"
            aria-label="Filter from date"
          />
          <span className="text-gray-400 text-sm" aria-hidden="true">–</span>
          <Input
            type="date"
            min={dateFrom || todayStr}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 text-sm max-w-[150px]"
            aria-label="Filter to date"
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-gray-500"
              onClick={() => { setDateFrom(''); setDateTo('') }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Eligible-only toggle */}
        {ineligibleCount > 0 && (
          <button
            onClick={() => setShowOnlyEligible(!showOnlyEligible)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              showOnlyEligible
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {showOnlyEligible
              ? `✓ Showing only ${listings.length - ineligibleCount} eligible`
              : `Show only eligible (${ineligibleCount} ineligible hidden)`}
          </button>
        )}
      </div>

      {/* Count + reset */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {filtered.length === 0
            ? 'No listings found'
            : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}
          {hasFilters && <span className="ml-1 text-gray-400">(filtered)</span>}
        </p>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gray-500"
            onClick={() => {
              setTypeFilter('ALL')
              setListingTypeFilter('ALL')
              setDateFrom('')
              setDateTo('')
              setShowOnlyEligible(false)
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Listings */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Store className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-600">No listings available</p>
          <p className="text-sm mt-1">
            {listings.length === 0
              ? 'Check back later — listings appear here when other TPs publish them'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((adj) => {
            const e = eligibility.get(adj.id)
            return (
              <ListingCard
                key={adj.id}
                adj={adj}
                canAccept={e?.canAccept ?? true}
                violations={e?.violations ?? []}
                onAccept={setSelectedAdj}
              />
            )
          })}
        </div>
      )}

      {/* Accept dialog — passes pre-computed violations so it can show them immediately */}
      <AcceptDialog
        adj={selectedAdj}
        violations={selectedEligibility?.violations ?? []}
        onClose={() => setSelectedAdj(null)}
      />
    </>
  )
}
