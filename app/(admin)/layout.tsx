import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Back to App
            </a>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900">Admin Panel</span>
          </div>
          <AdminNav />
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  )
}
