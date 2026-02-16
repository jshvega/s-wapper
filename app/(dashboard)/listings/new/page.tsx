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

  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('effective_from', { ascending: false })

  return <ListingForm schedule={(schedules ?? []) as Schedule[]} />
}
