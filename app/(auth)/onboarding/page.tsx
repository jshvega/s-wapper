import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if user already has a schedule
  const { data: existingSchedule } = await supabase
    .from('schedules')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (existingSchedule && existingSchedule.length > 0) {
    redirect('/dashboard')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Set up your schedule</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your base weekly schedule. You need exactly 5 workdays and 2 days off.
      </p>
      <OnboardingForm userId={user.id} />
    </div>
  )
}
