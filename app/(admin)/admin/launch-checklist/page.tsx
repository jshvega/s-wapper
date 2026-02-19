import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle, AlertCircle, Rocket } from 'lucide-react'

interface CheckItem {
  label: string
  description: string
  status: 'pass' | 'fail' | 'warn'
  detail?: string
}

async function runChecks(): Promise<CheckItem[]> {
  const supabase = await createClient()
  const checks: CheckItem[] = []

  // 1. Supabase URL
  checks.push({
    label: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL is configured',
    status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'pass' : 'fail',
    detail: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^(https:\/\/[^.]{6})[^.]+/, '$1***')
      : 'Not set',
  })

  // 2. Supabase Anon Key
  checks.push({
    label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key is configured',
    status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'pass' : 'fail',
    detail: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (eyJ...)' : 'Not set',
  })

  // 3. Service Role Key
  checks.push({
    label: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Service role key for server-side operations',
    status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'pass' : 'warn',
    detail: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'Set (eyJ...)'
      : 'Not set — notifications will fall back to anon key (dev mode)',
  })

  // 4. Cron Secret
  checks.push({
    label: 'CRON_SECRET',
    description: 'Secret key protecting /api/cron/* endpoints',
    status: process.env.CRON_SECRET ? 'pass' : 'warn',
    detail: process.env.CRON_SECRET ? 'Set' : 'Not set — cron endpoints are unprotected!',
  })

  // 5. Resend API Key (email notifications)
  checks.push({
    label: 'RESEND_API_KEY',
    description: 'Email notification provider (Resend)',
    status: process.env.RESEND_API_KEY ? 'pass' : 'warn',
    detail: process.env.RESEND_API_KEY ? 'Set' : 'Not set — email notifications disabled',
  })

  // 6. Twilio (SMS)
  const twilioConfigured =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  checks.push({
    label: 'Twilio SMS',
    description: 'SMS notifications (TWILIO_ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER)',
    status: twilioConfigured ? 'pass' : 'warn',
    detail: twilioConfigured ? 'All 3 variables set' : 'Not configured — SMS notifications disabled',
  })

  // 7. Admin user exists
  const { count: adminCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'ADMIN')
    .eq('is_active', true)

  checks.push({
    label: 'Admin user exists',
    description: 'At least one active admin account',
    status: (adminCount ?? 0) > 0 ? 'pass' : 'fail',
    detail: `${adminCount ?? 0} active admin(s)`,
  })

  // 8. Active bid period
  const { data: activePeriod } = await supabase
    .from('bid_periods')
    .select('name, start_date, end_date')
    .eq('is_active', true)
    .single()

  checks.push({
    label: 'Active bid period set',
    description: 'A bid period is active so the calendar has a defined scope',
    status: activePeriod ? 'pass' : 'warn',
    detail: activePeriod
      ? `"${activePeriod.name}" (${activePeriod.start_date} → ${activePeriod.end_date})`
      : 'No active bid period — calendar defaults to current week',
  })

  // 9. Test seed data check
  const { count: seedCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .like('email', '%@swapper.test')

  checks.push({
    label: 'Seed / test data',
    description: 'Check whether demo accounts (@swapper.test) are still present',
    status: (seedCount ?? 0) > 0 ? 'warn' : 'pass',
    detail:
      (seedCount ?? 0) > 0
        ? `${seedCount} test account(s) found — delete before production launch`
        : 'No test accounts found',
  })

  // 10. Total registered users
  const { count: userCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  checks.push({
    label: 'Registered users',
    description: 'Total active user accounts in the system',
    status: (userCount ?? 0) > 0 ? 'pass' : 'warn',
    detail: `${userCount ?? 0} active user(s)`,
  })

  return checks
}

export default async function LaunchChecklistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'ADMIN') redirect('/dashboard')

  const checks = await runChecks()

  const passCount = checks.filter((c) => c.status === 'pass').length
  const failCount = checks.filter((c) => c.status === 'fail').length
  const warnCount = checks.filter((c) => c.status === 'warn').length
  const allGreen = failCount === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-indigo-600" />
            Pre-Launch Checklist
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verify all systems are ready before launching S-WAPPER to users.
          </p>
        </div>
        <div className="text-right">
          <div
            className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              allGreen
                ? 'bg-green-100 text-green-800'
                : failCount > 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
            }`}
          >
            {passCount}/{checks.length} checks passed
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {failCount > 0 && `${failCount} failing`}
            {failCount > 0 && warnCount > 0 && ', '}
            {warnCount > 0 && `${warnCount} warning${warnCount > 1 ? 's' : ''}`}
            {failCount === 0 && warnCount === 0 && 'All critical checks pass!'}
          </p>
        </div>
      </div>

      {/* Overall status banner */}
      {allGreen ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">Ready for launch!</p>
            <p className="text-xs text-green-700 mt-0.5">
              No critical failures detected. Review any warnings and confirm you are happy before
              going live.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Not ready — fix failing checks</p>
            <p className="text-xs text-red-700 mt-0.5">
              {failCount} critical check{failCount > 1 ? 's' : ''} must be resolved before launch.
            </p>
          </div>
        </div>
      )}

      {/* Check list */}
      <div className="space-y-3">
        {checks.map((check) => (
          <CheckRow key={check.label} check={check} />
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-700">Before going live:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Set all environment variables in your Vercel project settings</li>
          <li>Rotate Supabase credentials if development was done in a shared environment</li>
          <li>
            Run{' '}
            <code className="bg-gray-200 px-1 rounded">
              supabase/migrations/014_bid_periods_and_security.sql
            </code>{' '}
            if not yet applied
          </li>
          <li>Delete seed / test data (@swapper.test accounts)</li>
          <li>Create an active bid period covering the upcoming schedule period</li>
          <li>Verify Vercel cron jobs are configured to call /api/cron/expire</li>
          <li>Send onboarding email to all TPs with registration link</li>
        </ol>
      </div>
    </div>
  )
}

function CheckRow({ check }: { check: CheckItem }) {
  const icons = {
    pass: <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />,
    fail: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    warn: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
  }

  const rowBg = {
    pass: 'bg-white',
    fail: 'bg-red-50 border-red-200',
    warn: 'bg-amber-50 border-amber-200',
  }

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-3 ${rowBg[check.status]}`}>
      {icons[check.status]}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{check.label}</p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              check.status === 'pass'
                ? 'bg-green-100 text-green-700'
                : check.status === 'fail'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
            }`}
          >
            {check.status === 'pass' ? 'Pass' : check.status === 'fail' ? 'Fail' : 'Warning'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{check.description}</p>
        {check.detail && (
          <p
            className={`text-xs mt-1 font-mono ${
              check.status === 'pass'
                ? 'text-gray-400'
                : check.status === 'fail'
                  ? 'text-red-600'
                  : 'text-amber-700'
            }`}
          >
            {check.detail}
          </p>
        )}
      </div>
    </div>
  )
}
