import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketplaceClient } from '@/components/marketplace/marketplace-client'
import { Plus } from 'lucide-react'
import type { Adjustment } from '@/lib/types'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all OPEN listings not created by the current user
  const { data } = await supabase
    .from('adjustments')
    .select('*, creator:profiles!creator_id(id, name)')
    .eq('status', 'OPEN')
    .neq('creator_id', user.id)
    .order('date', { ascending: true })

  const listings = (data ?? []) as Adjustment[]

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse available swap and cover listings</p>
        </div>
        <Link href="/listings/new">
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Post Listing
          </Button>
        </Link>
      </div>

      <MarketplaceClient initialListings={listings} currentUserId={user.id} />
    </div>
  )
}
