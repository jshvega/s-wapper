import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

/**
 * Test endpoint to verify Resend is wired up correctly.
 * Usage: GET /api/test-email?to=you@example.com
 *
 * Remove or protect this route before going to production.
 */
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to')

  if (!to) {
    return NextResponse.json(
      { error: 'Missing ?to= query param. Example: /api/test-email?to=you@example.com' },
      { status: 400 }
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'RESEND_API_KEY is not set in environment.',
        hint: 'Make sure it is in .env.local and that you restarted the dev server after adding it.',
      },
      { status: 500 }
    )
  }

  const resend = new Resend(apiKey)

  try {
    const result = await resend.emails.send({
      from: 'S-WAPPER <noreply@notification.s-wapper.com>',
      to,
      subject: 'S-WAPPER test email',
      html: `
        <p>This is a test email from <strong>S-WAPPER</strong>.</p>
        <p>If you received this, Resend is wired up correctly. ✓</p>
        <p style="color:#9ca3af;font-size:12px;">Sent at ${new Date().toISOString()}</p>
      `,
    })

    return NextResponse.json({ success: true, resend: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
