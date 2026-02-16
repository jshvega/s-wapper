import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScheduleEditor } from './schedule-editor'
import { NotificationPreferencesEditor } from '@/components/settings/notification-preferences'
import type { Schedule, NotificationPreferences } from '@/lib/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, schedulesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('effective_from', { ascending: false }),
  ])

  const profile = profileRes.data
  const schedules = (schedulesRes.data ?? []) as Schedule[]

  const defaultPrefs: NotificationPreferences = {
    email: { accepted: true, timer_warning: true, confirmed: true, expired: true, shift_reminder: true, obligation_created: true },
    sms: { accepted: false, timer_warning: false, confirmed: false, expired: false, shift_reminder: false, obligation_created: false },
  }
  const notifPrefs: NotificationPreferences = profile?.notification_preferences ?? defaultPrefs

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile and weekly schedule.</p>
      </div>

      {/* Profile card */}
      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Name</p>
            <p className="font-medium text-gray-900">{profile?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Role</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              profile?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {profile?.role}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{profile?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Phone</p>
            <p className="font-medium text-gray-900">{profile?.phone ?? '—'}</p>
          </div>
        </div>
      </section>

      {/* Schedule editor */}
      <section className="bg-white rounded-xl border p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Weekly Schedule</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Changes apply going forward. Existing confirmed adjustments are not affected.
          </p>
        </div>
        <ScheduleEditor schedules={schedules} />
      </section>

      {/* Notification preferences */}
      <section className="bg-white rounded-xl border p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose which notifications you receive by email and SMS.
          </p>
        </div>
        <NotificationPreferencesEditor preferences={notifPrefs} />
      </section>
    </div>
  )
}
