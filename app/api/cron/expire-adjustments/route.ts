import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { checkExpirationWarnings } from '@/lib/utils/expiration-warnings'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel Cron or manual trigger)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service-role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Find all expired PENDING_CONFIRMATION adjustments
  const { data: expired, error: fetchError } = await supabase
    .from('adjustments')
    .select('id, creator_id, accepter_id, type, date')
    .eq('status', 'PENDING_CONFIRMATION')
    .lt('expires_at', new Date().toISOString())

  if (fetchError) {
    console.error('Error fetching expired adjustments:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch expired adjustments' }, { status: 500 })
  }

  // Also check for adjustments expiring soon (4-hour warning)
  const warningResult = await checkExpirationWarnings()

  if (!expired || expired.length === 0) {
    return NextResponse.json({
      expired: 0,
      warnings: warningResult.warned,
      message: 'No expired adjustments found',
    })
  }

  const results = []

  for (const adj of expired) {
    // Update status to EXPIRED
    const { error: updateError } = await supabase
      .from('adjustments')
      .update({
        status: 'EXPIRED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', adj.id)
      .eq('status', 'PENDING_CONFIRMATION') // optimistic concurrency

    if (updateError) {
      console.error(`Failed to expire adjustment ${adj.id}:`, updateError)
      results.push({ id: adj.id, success: false })
      continue
    }

    // Log the expiration
    await supabase.from('adjustment_logs').insert({
      adjustment_id: adj.id,
      action: 'EXPIRED',
      actor_id: null, // system action
      metadata: { reason: 'cron_expiration', expired_at: new Date().toISOString() },
    })

    // Notify both parties (console.log for now)
    console.log(
      `[NOTIFICATION] Adjustment ${adj.id} (${adj.type} on ${adj.date}) has expired. ` +
      `Notifying creator ${adj.creator_id} and accepter ${adj.accepter_id}.`
    )

    results.push({ id: adj.id, success: true })
  }

  const successCount = results.filter((r) => r.success).length

  console.log(`[CRON] Expired ${successCount}/${expired.length} adjustments`)

  return NextResponse.json({
    expired: successCount,
    total: expired.length,
    warnings: warningResult.warned,
    results,
  })
}
