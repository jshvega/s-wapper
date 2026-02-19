import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/sidebar'
import { MobileNav } from '@/components/shared/mobile-nav'
import { PwaInstallPrompt } from '@/components/shared/pwa-install'
import type { Profile, BidPeriod } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile row exists yet (e.g. email confirmed before profiles table existed),
  // create it on the fly so we never redirect authenticated users to /login
  // (which would cause a middleware loop: /dashboard → /login → /dashboard)
  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name ?? user.email!.split('@')[0],
      phone: user.user_metadata?.phone ?? null,
      role: 'TP',
      is_active: true,
    })
    redirect('/onboarding')
  }

  // Redirect new users to onboarding if no schedule
  const { data: schedule } = await supabase
    .from('schedules')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (!schedule || schedule.length === 0) redirect('/onboarding')

  const { data: activeBidPeriod } = await supabase
    .from('bid_periods')
    .select('id, name, start_date, end_date, is_active, created_at')
    .eq('is_active', true)
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar profile={profile as Profile} activeBidPeriod={activeBidPeriod as BidPeriod | null} />
      <main className="flex-1 flex flex-col min-h-screen lg:ml-0 pb-16 lg:pb-0">
        {children}
      </main>
      <MobileNav />
      <PwaInstallPrompt />
    </div>
  )
}
