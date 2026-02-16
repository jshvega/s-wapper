'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ListingCard } from '@/components/marketplace/listing-card'
import { AcceptDialog } from '@/components/marketplace/accept-dialog'
import { createClient } from '@/lib/supabase/client'
import { Search, Store } from 'lucide-react'
import type { Adjustment, AdjustmentType, ListingType } from '@/lib/types'

interface MarketplaceClientProps {
  initialListings: Adjustment[]
  currentUserId: string
}

type TypeFilter = AdjustmentType | 'ALL'
type ListingTypeFilter = ListingType | 'ALL'

export function MarketplaceClient({ initialListings, currentUserId }: MarketplaceClientProps) {
  const [listings, setListings] = useState<Adjustment[]>(initialListings)
  const [selectedAdj, setSelectedAdj] = useState<Adjustment | null>(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [listingTypeFilter, setListingTypeFilter] = useState<ListingTypeFilter>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Real-time subscription
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
    return true
  })

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-5">
        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'SWAP', 'COVER'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                typeFilter === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}

          <div className="w-px bg-gray-200 mx-1" />

          {(['ALL', 'REQUEST', 'OFFER'] as ListingTypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setListingTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                listingTypeFilter === t
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'REQUEST' ? 'Needs Help' : 'Offering'}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <Input
            type="date"
            min={todayStr}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 text-sm max-w-[160px]"
            placeholder="From"
          />
          <span className="text-gray-400 text-sm">–</span>
          <Input
            type="date"
            min={dateFrom || todayStr}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 text-sm max-w-[160px]"
            placeholder="To"
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
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {filtered.length === 0
            ? 'No listings found'
            : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}
          {(typeFilter !== 'ALL' || listingTypeFilter !== 'ALL' || dateFrom || dateTo) && (
            <span className="ml-1 text-gray-400">(filtered)</span>
          )}
        </p>
        {(typeFilter !== 'ALL' || listingTypeFilter !== 'ALL' || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gray-500"
            onClick={() => {
              setTypeFilter('ALL')
              setListingTypeFilter('ALL')
              setDateFrom('')
              setDateTo('')
            }}
          >
            Reset filters
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
          {filtered.map((adj) => (
            <ListingCard key={adj.id} adj={adj} onAccept={setSelectedAdj} />
          ))}
        </div>
      )}

      {/* Accept dialog */}
      <AcceptDialog adj={selectedAdj} onClose={() => setSelectedAdj(null)} />
    </>
  )
}
