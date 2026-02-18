import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TradeIdInput } from '@/components/listings/trade-id-input'
import { CancelAdjustmentButton } from '@/components/listings/cancel-adjustment-button'
import { formatTime } from '@/lib/utils/dates'
import { ArrowLeft, Calendar, Clock, User, FileText } from 'lucide-react'
import type { Adjustment } from '@/lib/types'

const STATUS_BADGE: Record<string, { variant: 'default' | 'secondary' | 'warning' | 'success' | 'destructive' | 'info'; label: string }> = {
  DRAFT:                { variant: 'secondary',   label: 'Draft' },
  OPEN:                 { variant: 'info',         label: 'Open in Marketplace' },
  PENDING_CONFIRMATION: { variant: 'warning',      label: 'Pending Trade ID' },
  CONFIRMED:            { variant: 'success',      label: 'Confirmed' },
  EXPIRED:              { variant: 'destructive',  label: 'Expired' },
  REMOVED:              { variant: 'secondary',    label: 'Removed' },
  CANCELLED:            { variant: 'destructive',  label: 'Cancelled' },
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('adjustments')
    .select('*, creator:profiles!creator_id(id, name, email), accepter:profiles!accepter_id(id, name, email)')
    .eq('id', params.id)
    .single()

  if (!data) notFound()

  const adj = data as Adjustment

  const isCreator = adj.creator_id === user.id
  const isAccepter = adj.accepter_id === user.id
  if (!isCreator && !isAccepter && adj.status !== 'OPEN') {
    redirect('/marketplace')
  }

  const statusInfo = STATUS_BADGE[adj.status] ?? { variant: 'secondary' as const, label: adj.status }
  const canEnterTradeId = adj.status === 'PENDING_CONFIRMATION' && (isCreator || isAccepter)
  // PENDING: only creator can cancel. CONFIRMED: either party can cancel.
  const canCancel =
    (adj.status === 'PENDING_CONFIRMATION' && isCreator) ||
    (adj.status === 'CONFIRMED' && (isCreator || isAccepter))

  const dateDisplay = new Date(adj.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const createdDisplay = new Date(adj.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={isCreator ? '/listings' : '/marketplace'}>
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Listing Detail</h1>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusInfo.variant} className="text-sm py-1 px-3">{statusInfo.label}</Badge>
          <Badge variant="outline">{adj.type}</Badge>
          <Badge variant="outline">{adj.listing_type === 'REQUEST' ? 'Requesting' : 'Offering'}</Badge>
        </div>

        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-gray-900">{dateDisplay}</p>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Shift on that day</p>
                <p className="text-sm font-medium">
                  {formatTime(adj.original_shift_start)} – {formatTime(adj.original_shift_end)}
                </p>
                {adj.desired_shift_start && (
                  <>
                    <p className="text-xs text-gray-500 mt-2 mb-0.5">Desired shift in return</p>
                    <p className="text-sm font-medium">
                      {formatTime(adj.desired_shift_start)} – {formatTime(adj.desired_shift_end)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {adj.notes && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600 italic">&quot;{adj.notes}&quot;</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Created by</p>
                <p className="text-sm font-medium">{(adj.creator as any)?.name ?? 'Unknown'}</p>
              </div>
            </div>

            {adj.accepter && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Accepted by</p>
                  <p className="text-sm font-medium">{(adj.accepter as any)?.name ?? 'Unknown'}</p>
                  {adj.accepted_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(adj.accepted_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {adj.status === 'CONFIRMED' && adj.aspect_trade_id && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-green-800">Confirmed in Aspect</p>
              <p className="text-sm text-green-700 mt-1">
                Trade ID: <span className="font-mono font-bold">{adj.aspect_trade_id}</span>
              </p>
              {adj.confirmed_at && (
                <p className="text-xs text-green-600 mt-1">
                  Confirmed {new Date(adj.confirmed_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {adj.status === 'CANCELLED' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-red-800">This adjustment was cancelled</p>
              {adj.aspect_trade_id && (
                <p className="text-sm text-red-700 mt-1 line-through">
                  Trade ID: {adj.aspect_trade_id}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {canEnterTradeId && (
          <TradeIdInput adjustmentId={adj.id} expiresAt={adj.expires_at} />
        )}

        {canCancel && (
          <CancelAdjustmentButton
            adjustmentId={adj.id}
            status={adj.status as 'PENDING_CONFIRMATION' | 'CONFIRMED'}
          />
        )}

        <p className="text-xs text-gray-400 text-right">Listed {createdDisplay}</p>
      </div>
    </div>
  )
}
