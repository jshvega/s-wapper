import { Skeleton } from '@/components/ui/skeleton'

export default function LedgerLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-4 w-64" />

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      <Skeleton className="h-6 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>

      <Skeleton className="h-6 w-36" />
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  )
}
