'use client'

import { ErrorDisplay } from '@/components/shared/error-display'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorDisplay
      title="Something went wrong"
      message={error.message || 'An unexpected error occurred. Please try again.'}
      retry={reset}
    />
  )
}
