import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ListingForm } from '@/components/listings/listing-form'
import type { Schedule } from '@/lib/types'

export default async function NewListingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [schedulesRes, bidPeriodRes] = await Promise.all([
    supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('effective_from', { ascending: false }),
    supabase
      .from('bid_periods')
      .select('name, start_date, end_date')
      .eq('is_active', true)
      .maybeSingle(),
  ])

  return (
    <ListingForm
      schedule={(schedulesRes.data ?? []) as Schedule[]}
      bidPeriod={bidPeriodRes.data ?? null}
    />
  )
}
