-- Migration 003: Adjustments
-- The core swap/cover listing table

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

-- Anyone can view OPEN listings (for marketplace)
create policy "Anyone can view open listings"
  on public.adjustments for select
  using (
    status = 'OPEN' or
    auth.uid() = creator_id or
    auth.uid() = accepter_id
  );

-- Users can create their own listings
create policy "Users can create listings"
  on public.adjustments for insert
  with check (auth.uid() = creator_id);

-- Creators and accepters can update (for accepting, confirming)
create policy "Involved parties can update adjustments"
  on public.adjustments for update
  using (
    auth.uid() = creator_id or
    auth.uid() = accepter_id or
    -- Allow accepting (no accepter yet)
    (auth.uid() is not null and accepter_id is null and status = 'OPEN')
  );

-- Performance indexes
create index idx_adjustments_status_date on public.adjustments(status, date);
create index idx_adjustments_creator on public.adjustments(creator_id);
create index idx_adjustments_accepter on public.adjustments(accepter_id);
create index idx_adjustments_expires on public.adjustments(expires_at) where status = 'PENDING_CONFIRMATION';

-- Auto-update updated_at
create trigger adjustments_updated_at
  before update on public.adjustments
  for each row execute procedure public.handle_updated_at();
