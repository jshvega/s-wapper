import { getBidPeriods } from '@/lib/actions/admin'
import { BidPeriodsClient } from '@/components/admin/bid-periods-client'

export default async function BidPeriodsPage() {
  const { data: bidPeriods, error } = await getBidPeriods()

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Bid Periods</h1>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bid Periods</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define scheduling bid periods. Only one can be active at a time.
          The active period is shown in the calendar and settings.
        </p>
      </div>
      <BidPeriodsClient bidPeriods={bidPeriods ?? []} />
    </div>
  )
}
