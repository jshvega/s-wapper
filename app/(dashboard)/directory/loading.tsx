import { Skeleton } from '@/components/ui/skeleton'

export default function DirectoryLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-4xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-9 w-full rounded-md" />

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
