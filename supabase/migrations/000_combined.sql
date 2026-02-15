-- SWAPPER — Combined Migration
-- Run this entire file in the Supabase SQL Editor to set up the full schema.
-- Last updated: 2026-02-14

-- ============================================================
-- 001: PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  phone text unique,
  name text not null,
  role text not null default 'TP' check (role in ('TP', 'ADMIN')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can view profiles"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 002: SCHEDULES
-- ============================================================

create type day_of_week as enum ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week day_of_week not null,
  shift_start time,
  shift_end time,
  is_day_off boolean not null default false,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),

  constraint valid_shift check (
    (is_day_off = true and shift_start is null and shift_end is null) or
    (is_day_off = false and shift_start is not null and shift_end is not null)
  ),

  unique(user_id, day_of_week, effective_from)
);

alter table public.schedules enable row level security;

create policy "Anyone can view schedules"
  on public.schedules for select using (true);

create policy "Users can insert own schedule"
  on public.schedules for insert with check (auth.uid() = user_id);

create policy "Users can update own schedule"
  on public.schedules for update using (auth.uid() = user_id);

create policy "Users can delete own schedule"
  on public.schedules for delete using (auth.uid() = user_id);

create index idx_schedules_user on public.schedules(user_id);

-- ============================================================
-- 003: ADJUSTMENTS
-- ============================================================

create type adjustment_type as enum ('SWAP', 'COVER');
create type listing_type as enum ('REQUEST', 'OFFER');
create type adjustment_status as enum (
  'DRAFT', 'OPEN', 'ACCEPTED', 'PENDING_CONFIRMATION',
  'CONFIRMED', 'EXPIRED', 'REMOVED'
);

create table if not exists public.adjustments (
  id uuid primary key default gen_random_uuid(),
  type adjustment_type not null,
  listing_type listing_type not null,
  status adjustment_status not null default 'DRAFT',
  creator_id uuid references public.profiles(id) on delete cascade not null,
  accepter_id uuid references public.profiles(id) on delete set null,
  date date not null,
  original_shift_start time not null,
  original_shift_end time not null,
  desired_shift_start time,
  desired_shift_end time,
  notes text,
  aspect_track_id text,
  accepted_at timestamptz,
  confirmed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.adjustments enable row level security;

create policy "Anyone can view open listings"
  on public.adjustments for select
  using (
    status = 'OPEN' or
    auth.uid() = creator_id or
    auth.uid() = accepter_id
  );

create policy "Users can create listings"
  on public.adjustments for insert
  with check (auth.uid() = creator_id);

create policy "Involved parties can update adjustments"
  on public.adjustments for update
  using (
    auth.uid() = creator_id or
    auth.uid() = accepter_id or
    (auth.uid() is not null and accepter_id is null and status = 'OPEN')
  );

create index idx_adjustments_status_date on public.adjustments(status, date);
create index idx_adjustments_creator on public.adjustments(creator_id);
create index idx_adjustments_accepter on public.adjustments(accepter_id);
create index idx_adjustments_expires on public.adjustments(expires_at) where status = 'PENDING_CONFIRMATION';

create trigger adjustments_updated_at
  before update on public.adjustments
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 004: LEDGER ENTRIES
-- ============================================================

create type settlement_type as enum ('COVER_RETURNED', 'CASH', 'FORGIVEN');

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  creditor_id uuid references public.profiles(id) on delete cascade not null,
  debtor_id uuid references public.profiles(id) on delete cascade not null,
  adjustment_id uuid references public.adjustments(id) on delete cascade not null unique,
  is_settled boolean not null default false,
  settled_at timestamptz,
  settlement_type settlement_type,
  created_at timestamptz not null default now()
);

alter table public.ledger_entries enable row level security;

create policy "Users can view own ledger entries"
  on public.ledger_entries for select
  using (auth.uid() = creditor_id or auth.uid() = debtor_id);

create policy "Involved parties can update ledger entries"
  on public.ledger_entries for update
  using (auth.uid() = creditor_id or auth.uid() = debtor_id);

create policy "Service role can insert ledger entries"
  on public.ledger_entries for insert
  with check (true);

create index idx_ledger_creditor on public.ledger_entries(creditor_id);
create index idx_ledger_debtor on public.ledger_entries(debtor_id);
create index idx_ledger_settled on public.ledger_entries(is_settled);

-- ============================================================
-- 005: ADJUSTMENT LOGS
-- ============================================================

create type log_action as enum (
  'CREATED', 'PUBLISHED', 'ACCEPTED', 'CONFIRMED', 'EXPIRED', 'REMOVED'
);

create table if not exists public.adjustment_logs (
  id uuid primary key default gen_random_uuid(),
  adjustment_id uuid references public.adjustments(id) on delete cascade not null,
  action log_action not null,
  actor_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.adjustment_logs enable row level security;

create policy "Involved parties can view logs"
  on public.adjustment_logs for select
  using (
    auth.uid() = actor_id or
    exists (
      select 1 from public.adjustments a
      where a.id = adjustment_id
      and (a.creator_id = auth.uid() or a.accepter_id = auth.uid())
    )
  );

create policy "Authenticated users can insert logs"
  on public.adjustment_logs for insert
  with check (auth.uid() is not null);

create index idx_logs_adjustment on public.adjustment_logs(adjustment_id);
create index idx_logs_actor on public.adjustment_logs(actor_id);

-- ============================================================
-- 006: NOTIFICATIONS
-- ============================================================

create type notification_type as enum (
  'NEW_MATCH', 'ACCEPTED', 'TIMER_WARNING', 'CONFIRMED',
  'EXPIRED', 'SHIFT_REMINDER', 'OBLIGATION_CREATED'
);
create type notification_channel as enum ('EMAIL', 'SMS', 'IN_APP');
create type notification_status as enum ('PENDING', 'SENT', 'FAILED');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type notification_type not null,
  channel notification_channel not null,
  status notification_status not null default 'PENDING',
  content_summary text,
  related_adjustment_id uuid references public.adjustments(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Server can insert notifications"
  on public.notifications for insert with check (true);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

create index idx_notifications_user_status on public.notifications(user_id, status);
create index idx_notifications_pending on public.notifications(status, created_at) where status = 'PENDING';
