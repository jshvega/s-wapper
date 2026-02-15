import { createClient } from '@/lib/supabase/server'

export default async function AdminAdjustmentsPage() {
  const supabase = await createClient()

  const { data: adjustments } = await supabase
    .from('adjustments')
    .select('*, creator:profiles!creator_id(name), accepter:profiles!accepter_id(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    OPEN: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-cyan-100 text-cyan-700',
    PENDING_CONFIRMATION: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-red-100 text-red-700',
    REMOVED: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="max-w-6xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">All Adjustments</h1>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Creator</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Accepter</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Track ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {adjustments?.map((adj) => (
              <tr key={adj.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{new Date(adj.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium">{adj.type} / {adj.listing_type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[adj.status] || ''}`}>
                    {adj.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{(adj.creator as any)?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{(adj.accepter as any)?.name ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{adj.aspect_track_id ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(adj.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!adjustments || adjustments.length === 0) && (
          <p className="text-center text-gray-500 py-8">No adjustments found.</p>
        )}
      </div>
    </div>
  )
}
