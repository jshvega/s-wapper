-- Migration 011: Support for legacy/historical adjustments
-- Allows TPs to enter past adjustments that occurred before SWAPPER.

-- Add is_legacy flag to adjustments to distinguish from marketplace-created ones
alter table public.adjustments add column if not exists is_legacy boolean not null default false;

-- Pending debts table for unregistered TPs
create table if not exists public.pending_debts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id),
  type text not null check (type in ('SWAP', 'COVER')),
  date date not null,
  shift_start time,
  shift_end time,
  other_party_name text not null,
  aspect_trade_id text,
  notes text,
  role text not null check (role in ('CREDITOR', 'DEBTOR')),
  linked_adjustment_id uuid references public.adjustments(id),
  linked_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS for pending_debts
alter table public.pending_debts enable row level security;

create policy "Users can view own pending debts"
  on public.pending_debts for select
  using (auth.uid() = creator_id);

create policy "Users can insert own pending debts"
  on public.pending_debts for insert
  with check (auth.uid() = creator_id);

create policy "Users can update own pending debts"
  on public.pending_debts for update
  using (auth.uid() = creator_id);
