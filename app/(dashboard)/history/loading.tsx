import { Skeleton } from '@/components/ui/skeleton'

export default function HistoryLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-4xl">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-4 w-56" />

      <Skeleton className="h-9 w-24 rounded-md" />

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
