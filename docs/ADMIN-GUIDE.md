# S-WAPPER — Admin Guide

**Version:** 1.0
**Last updated:** February 18, 2026

---

## Table of Contents

1. [Admin Overview](#1-admin-overview)
2. [Accessing the Admin Panel](#2-accessing-the-admin-panel)
3. [Admin Dashboard](#3-admin-dashboard)
4. [Managing Users](#4-managing-users)
5. [Managing Adjustments](#5-managing-adjustments)
6. [Force Expire and Force Confirm](#6-force-expire-and-force-confirm)
7. [Viewing Activity Logs](#7-viewing-activity-logs)
8. [Bid Period Management](#8-bid-period-management)
9. [Pre-Launch Checklist](#9-pre-launch-checklist)
10. [Database Maintenance](#10-database-maintenance)
11. [Security Notes](#11-security-notes)

---

## 1. Admin Overview

Admins have full oversight of all S-WAPPER activity. The admin panel is accessible only to users with `role = 'ADMIN'`.

**Admin capabilities:**
- View all users, adjustments, ledger entries, and logs
- Activate or deactivate user accounts
- Change user roles (TP ↔ ADMIN)
- Force-expire or force-confirm pending adjustments
- Export activity logs (CSV)
- Manage bid periods
- View the pre-launch readiness checklist

**What admins cannot do from the UI:**
- Edit or delete confirmed adjustments (use Supabase SQL for emergencies)
- Edit individual ledger entries (use SQL for corrections)

---

## 2. Accessing the Admin Panel

### Becoming an Admin

The first user to register can be promoted to admin via the Supabase Dashboard:

```sql
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

Or, if using the seed data, `admin@swapper.test` is already an ADMIN.

Alternatively, any existing admin can promote another user from **Admin → Users → [User Detail] → Change Role**.

### Navigating to Admin

Once your account has `role = 'ADMIN'`:

1. Log in to S-WAPPER
2. Click **Admin** in the sidebar (shield icon) or navigate to `/admin`

Non-admin users who try to access `/admin` are redirected to `/dashboard`.

---

## 3. Admin Dashboard

The Admin Dashboard (`/admin`) shows:

| Stat card | Description |
|-----------|-------------|
| Total Users | Active + inactive user count |
| Active Listings | Currently OPEN in marketplace |
| Pending Confirmation | Adjustments in their 24-hour window |
| Confirmed This Week | Adjustments that reached CONFIRMED status |
| Expired This Week | Adjustments that expired without a Trade ID |

### Demo Mode: "Expire Now" Button

During development/demo, the **Expire Now** button manually triggers the expiration job for all overdue adjustments. In production, this is handled by the Vercel Cron job (`/api/cron/expire-adjustments`).

---

## 4. Managing Users

Navigate to **Admin → Users** (`/admin/users`).

### User List

The user list shows all registered TPs and admins with:
- Name and email
- Role (TP / ADMIN)
- Active status
- Registration date

### Search and Filter

Use the search box to filter by name or email. Filter by role or active status using the dropdown.

### User Detail View

Click on any user to open the detail panel:

| Section | What you can do |
|---------|----------------|
| **Profile** | View name, email, phone, role, status |
| **Schedule** | View their 7-day base schedule |
| **Adjustment History** | All adjustments as creator or accepter |
| **Ledger Balance** | Covers owed and owed to this user |

### Actions

| Action | Effect |
|--------|--------|
| **Deactivate** | Sets `is_active = false`. User can no longer log in. Existing data is preserved. |
| **Reactivate** | Sets `is_active = true`. User can log in again. |
| **Change Role: TP → ADMIN** | Grants admin panel access |
| **Change Role: ADMIN → TP** | Removes admin panel access |

> Deactivating a user does not delete their data. All their historical adjustments and ledger entries remain visible to admins.

---

## 5. Managing Adjustments

Navigate to **Admin → Adjustments** (`/admin/adjustments`).

### Adjustment List

Shows all adjustments (up to 200 by default) with:
- Type (SWAP / COVER)
- Listing type (REQUEST / OFFER)
- Status (with color coding)
- Creator name
- Accepter name (if accepted)
- Date of adjustment
- Creation date

### Filters

| Filter | Options |
|--------|---------|
| Status | DRAFT / OPEN / PENDING_CONFIRMATION / CONFIRMED / EXPIRED / REMOVED / CANCELLED |
| Type | SWAP / COVER |
| Date range | From → To |
| User | Search by creator or accepter name |

### Adjustment Detail

Click any adjustment to see:
- Full adjustment details
- Countdown timer (if PENDING_CONFIRMATION)
- Complete audit log (who did what and when)
- Trade ID (if confirmed)

---

## 6. Force Expire and Force Confirm

These are admin-only actions for resolving stuck or disputed adjustments.

### Force Expire

**Use case:** An adjustment is stuck in PENDING_CONFIRMATION and needs to be voided (e.g., parties agreed to cancel, Trade ID was never processed in Aspect).

**Steps:**
1. Open the adjustment in Admin → Adjustments → [Adjustment ID]
2. Click **Force Expire**
3. Confirm the action

**Effect:**
- Status → `EXPIRED`
- Logged in adjustment_logs with actor = admin user
- No ledger entry is created (same as normal expiration)
- Both parties receive an expiration notification

### Force Confirm

**Use case:** A Trade ID exists in Aspect but was entered incorrectly in S-WAPPER (or the user couldn't access the app in time).

**Steps:**
1. Open the adjustment in Admin → Adjustments → [Adjustment ID]
2. Click **Force Confirm**
3. Enter the Aspect Trade ID
4. Confirm the action

**Effect:**
- Status → `CONFIRMED`
- `aspect_trade_id` is set
- `confirmed_at` is set to now
- Logged in adjustment_logs with actor = admin user
- If type = COVER, a ledger entry is created
- Both parties receive a confirmation notification

> Only use Force Confirm if you have verified the Trade ID exists in Aspect.

---

## 7. Viewing Activity Logs

Navigate to **Admin → Logs** (`/admin/logs`).

### What's Logged

Every state change for every adjustment is recorded:

| Action | Triggered by |
|--------|-------------|
| CREATED | User saves a new listing |
| PUBLISHED | User publishes a draft |
| ACCEPTED | Another TP accepts the listing |
| CONFIRMED | Trade ID entered |
| EXPIRED | 24-hour window elapsed (cron or manual) |
| REMOVED | Creator deleted the listing |
| CANCELLED | Admin or system cancelled the adjustment |

Each log entry includes:
- Timestamp
- Adjustment ID
- Action
- Actor (who triggered it; null for automated actions)
- Metadata (Trade ID, accepter name, reason, etc.)

### Filter by User

Use the user search dropdown to see all actions taken by or on behalf of a specific user.

### Export to CSV

Click **Export CSV** to download all visible log entries as a spreadsheet. Useful for audits or dispute resolution.

---

## 8. Bid Period Management

Navigate to **Admin → Bid Periods** (`/admin/bid-periods`).

A **Bid Period** represents a scheduling block (e.g., March 2026 bid). Setting a bid period helps TPs understand the date range within which their adjustments apply.

### Table Structure

```sql
bid_periods (
  id          uuid primary key,
  name        text not null,          -- e.g. "March 2026 Bid"
  start_date  date not null,
  end_date    date not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
)
```

### Creating a Bid Period

1. Go to Admin → Bid Periods
2. Click **New Bid Period**
3. Enter:
   - **Name** — e.g., "March 2026 Bid"
   - **Start Date** — first day of the bid period
   - **End Date** — last day of the bid period
4. Click **Save**
5. Click **Set as Active** to make it the current bid period

> Only one bid period can be active at a time. Setting a new one as active automatically deactivates the previous one.

### Effect on the Calendar

- When a bid period is active, the calendar defaults to showing the bid period's date range
- Users can still navigate to other dates manually
- The active bid period name and dates are shown in the app footer / settings

### No Active Bid Period

If no bid period is active, the calendar shows the current week by default (legacy behavior).

---

## 9. Pre-Launch Checklist

Navigate to **Admin → Launch Checklist** (`/admin/launch-checklist`).

This page shows the real-time readiness status of the application before going live.

| Check | Description | Status |
|-------|-------------|--------|
| ✅ Environment Variables | All required env vars are set | Checked via `process.env` |
| ✅ RLS Policies | Row-level security is enabled on all tables | Checked via Supabase system tables |
| ✅ Admin User Exists | At least 1 user with role = ADMIN | Checked via profiles count |
| ✅ Bid Period Set | At least 1 active bid period exists | Checked via bid_periods table |
| ⚠️ Test Data | Whether seed/test accounts still exist | Flags if `@swapper.test` emails found |
| ✅ Cron Job Configured | `CRON_SECRET` env var present | Checked via `process.env.CRON_SECRET` |

### Clearing Test Data

Before launch, remove seed data by running:

```sql
-- ⚠️ IRREVERSIBLE — only run in production when ready
DELETE FROM auth.users WHERE email LIKE '%@swapper.test';
-- Profiles, schedules, adjustments cascade-delete automatically
```

Or use the **Clear Test Data** button in the admin panel (requires confirmation).

---

## 10. Database Maintenance

### Manually Expiring Overdue Adjustments

In production, the Vercel Cron job handles this every 15 minutes. To run it manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/expire-adjustments
```

Or use the **Expire Now** button in the Admin Dashboard (demo mode).

### Checking for Stale Pending Adjustments

```sql
SELECT id, creator_id, accepter_id, date, status, expires_at
FROM public.adjustments
WHERE status = 'PENDING_CONFIRMATION'
  AND expires_at < now()
ORDER BY expires_at;
```

### Fixing Stale Ledger Entries

If a confirmed cover was later cancelled, its ledger entry may still show as unsettled:

```sql
UPDATE public.ledger_entries
SET is_settled = true,
    settled_at = now(),
    settlement_type = 'CANCELLED'
WHERE is_settled = false
  AND adjustment_id IN (
    SELECT id FROM public.adjustments
    WHERE status IN ('REMOVED', 'CANCELLED', 'EXPIRED')
  );
```

### Promoting a User to Admin

```sql
UPDATE public.profiles
SET role = 'ADMIN', updated_at = now()
WHERE email = 'user@example.com';
```

### Deactivating a User (SQL)

```sql
UPDATE public.profiles
SET is_active = false, updated_at = now()
WHERE id = 'user-uuid-here';
```

---

## 11. Security Notes

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

| Table | Policy Summary |
|-------|---------------|
| `profiles` | Anyone can view; users can only update their own |
| `schedules` | Anyone can view; users can only modify their own |
| `adjustments` | Users see OPEN listings + their own; admins see all via service_role |
| `ledger_entries` | Users see entries involving them; admins see all |
| `adjustment_logs` | Read-only for all users; insert via server actions only |
| `notifications` | Users see their own only |

### API Key Security

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose — it's limited by RLS
- `SUPABASE_SERVICE_ROLE_KEY` must **never** be exposed client-side
- `CRON_SECRET` secures the cron endpoints — keep it secret

### Environment Variables Required for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Server-only, never expose to client
CRON_SECRET=your-random-secret
# Optional (for real notifications):
RESEND_API_KEY=re_xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
```

### Auth Bypass Prevention

- All server actions call `supabase.auth.getUser()` before any DB operation
- The admin layout checks `profile.role === 'ADMIN'` server-side and redirects
- The Supabase middleware protects all dashboard routes

### Sensitive Data

- Passwords are never stored in plain text (Supabase Auth handles bcrypt hashing)
- Phone numbers are stored in `profiles.phone` — visible to admins only via service_role
- No passwords, tokens, or secrets appear in logs or metadata

### Reporting Issues

If you discover a security issue, contact the system administrator immediately and do not share details publicly.

---

*For user-facing help, see the [User Guide](USER-GUIDE.md).*
