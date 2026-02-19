# S-WAPPER Security Review

**Date:** February 18, 2026
**Scope:** Full codebase audit — client/server code, migrations, environment config

---

## Summary

The codebase follows strong security practices with comprehensive Row Level Security (RLS) on all tables, proper auth checks in every server action, no SQL injection vulnerabilities, and multi-layer admin route protection. Two issues were found and addressed.

---

## Findings and Fixes

### 1. Service Role Key Fallback Pattern — FIXED

**File:** [lib/notifications/send.ts](../lib/notifications/send.ts)

**Issue:** The `getServiceSupabase()` function used `SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY` — a pattern that could confuse future developers about which key is being used, and silently fall back to the anon key without warning.

**Fix:**
- Added `import 'server-only'` to prevent accidental inclusion in client bundles
- Changed the fallback to log a clear warning when service role key is missing (dev mode)
- Documented the intent with a comment

### 2. Permissive Ledger Insert Policy — FIXED

**File:** [supabase/migrations/014_bid_periods_and_security.sql](../supabase/migrations/014_bid_periods_and_security.sql)

**Issue:** The original ledger_entries insert policy used `with check (true)`, which allowed any authenticated user to insert arbitrary ledger entries directly via the Supabase client library, bypassing server-side validation.

**Fix:** Replaced with a policy that requires:
- The inserting user is the creditor or debtor of the entry
- The referenced adjustment is `CONFIRMED` and type `COVER`

This prevents a user from fabricating cover obligations even if they bypass the app's server actions.

### 3. .env.local Committed — NOT AN ISSUE

The security scanner flagged `.env.local` as potentially committed. Confirmed: `.env.local` is listed in `.gitignore` and is **not** tracked by git (`git ls-files .env.local` returns empty). No action needed.

---

## Areas Checked

| Area | Result |
|------|--------|
| Hardcoded secrets in source code | ✅ None found |
| .env files committed to git | ✅ Properly gitignored |
| Server actions — auth checks | ✅ All functions call `getUser()` before DB ops |
| Server actions — owner checks | ✅ All update/delete verify user is creator/accepter |
| SQL injection | ✅ All queries use parameterized Supabase client API |
| Client-side service role key usage | ✅ None found in components or hooks |
| Admin routes — server-side role check | ✅ Protected at middleware + layout + action level |
| Sensitive data in URL params | ✅ None found |
| RLS — profiles | ✅ Public read; user-only write |
| RLS — schedules | ✅ Public read; user-only write |
| RLS — adjustments | ✅ Marketplace visible; own adjustments only |
| RLS — ledger_entries | ✅ Involved parties only; insert now requires confirmed cover |
| RLS — adjustment_logs | ✅ Read-only for users; server inserts |
| RLS — notifications | ✅ User sees own only |
| RLS — bid_periods | ✅ Public read; admin-only write |

---

## Ongoing Recommendations

1. **Rotate Supabase credentials before launch** — even if .env.local is gitignored, rotate keys as a precaution if development happened in any shared environment.

2. **Rate limiting** — Add rate limiting on `/api/cron/*` endpoints (currently protected by `CRON_SECRET`) and on auth endpoints if Supabase built-in limits are insufficient.

3. **Phone number at rest** — Phone numbers in `profiles.phone` are stored in plaintext. For higher security, consider encrypting this column using pgcrypto.

4. **CRON_SECRET** — Ensure this is set in production Vercel environment variables before deploying the cron jobs.

5. **Content Security Policy** — Consider adding a CSP header in `next.config.js` to mitigate XSS risks.
