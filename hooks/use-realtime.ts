'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe to real-time changes on the adjustments table.
 * Calls `onUpdate` whenever any row is inserted, updated, or deleted.
 */
export function useMarketplaceRealtime(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('marketplace-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'adjustments',
        },
        onUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}
