import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MyListingCard } from '@/components/listings/my-listing-card'
import { Plus, FileText } from 'lucide-react'
import type { Adjustment } from '@/lib/types'

export default async function ListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('adjustments')
    .select('*, accepter:profiles!accepter_id(id, name)')
    .eq('creator_id', user.id)
    .not('status', 'eq', 'REMOVED')
    .order('created_at', { ascending: false })

  const listings = (data ?? []) as Adjustment[]

  // Group by status for display
  const active = listings.filter((l) => ['DRAFT', 'OPEN', 'PENDING_CONFIRMATION'].includes(l.status))
  const settled = listings.filter((l) => ['CONFIRMED', 'EXPIRED', 'CANCELLED'].includes(l.status))

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {listings.length === 0 ? 'No listings yet' : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/listings/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-600">No listings yet</p>
          <p className="text-sm mt-1 mb-4">Create a listing to request or offer a swap or cover</p>
          <Link href="/listings/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first listing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active</h2>
              <div className="space-y-2">
                {active.map((adj) => (
                  <MyListingCard key={adj.id} adj={adj} />
                ))}
              </div>
            </section>
          )}

          {settled.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
              <div className="space-y-2">
                {settled.map((adj) => (
                  <MyListingCard key={adj.id} adj={adj} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
