-- Migration 014: Bid Periods table + Ledger insert RLS improvement
-- Part of Phase 10: Testing & Launch Prep

-- ══════════════════════════════════════════════════════════════════
-- 1. Bid Periods Table
-- ══════════════════════════════════════════════════════════════════
-- Represents a scheduling bid period (e.g., "March 2026 Bid").
-- Only one period can be active at a time (enforced by the app on set-active).

create table if not exists public.bid_periods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint valid_date_range check (end_date >= start_date)
);

-- RLS
alter table public.bid_periods enable row level security;

-- All authenticated users can view bid periods
create policy "Anyone can view bid periods"
  on public.bid_periods for select
  using (true);

-- Only admins can create bid periods (enforced at app layer via requireAdmin)
-- DB-level: allow service_role inserts (server actions use service_role)
create policy "Admins can manage bid periods"
  on public.bid_periods for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- 2. Ledger Insert RLS: Require confirmed COVER adjustment
-- ══════════════════════════════════════════════════════════════════
-- Previously the insert policy was `with check (true)` which allowed
-- any authenticated user to create arbitrary ledger entries via
-- the Supabase client library, bypassing app-layer validation.
--
-- This replacement policy requires that:
--   a) The referenced adjustment exists
--   b) The adjustment is CONFIRMED
--   c) The adjustment type is COVER
--   d) The inserting user is either the creditor or debtor
--
-- This prevents fake ledger entry creation even if a user bypasses
-- the server action and calls the Supabase API directly.

-- Drop the old permissive policy (name may vary; try both)
drop policy if exists "Service role can insert ledger entries" on public.ledger_entries;
drop policy if exists "Authenticated users can insert ledger entries" on public.ledger_entries;
drop policy if exists "Anyone can insert ledger entries" on public.ledger_entries;

create policy "Ledger insert requires confirmed cover"
  on public.ledger_entries for insert
  with check (
    -- Inserting user must be the creditor or debtor
    (auth.uid() = creditor_id or auth.uid() = debtor_id)
    and
    -- Referenced adjustment must be a CONFIRMED COVER
    exists (
      select 1 from public.adjustments a
      where a.id = adjustment_id
        and a.status = 'CONFIRMED'
        and a.type = 'COVER'
    )
  );

-- Note: Server actions (cron, admin force-confirm) run with service_role which
-- bypasses RLS entirely — this policy only applies to direct API calls.
