import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminAdjustmentDetail } from '@/components/admin/admin-adjustment-detail'

export default async function AdminAdjustmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: adjustment } = await supabase
    .from('adjustments')
    .select('*, creator:profiles!creator_id(*), accepter:profiles!accepter_id(*)')
    .eq('id', id)
    .single()

  if (!adjustment) redirect('/admin/adjustments')

  // Get full log history
  const { data: logs } = await supabase
    .from('adjustment_logs')
    .select('*, actor:profiles!actor_id(name)')
    .eq('adjustment_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <a href="/admin/adjustments" className="hover:text-gray-700">
          Adjustments
        </a>
        <span>/</span>
        <span className="text-gray-900">
          {adjustment.type} on {new Date(adjustment.date).toLocaleDateString()}
        </span>
      </div>

      <AdminAdjustmentDetail adjustment={adjustment} logs={logs ?? []} />
    </div>
  )
}
