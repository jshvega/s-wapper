export default function ListingDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Detail</h1>
      <p className="text-gray-500">Listing ID: {params.id}. Full detail view coming in Phase 3.</p>
    </div>
  )
}
