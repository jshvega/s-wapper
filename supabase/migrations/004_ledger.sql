-- Migration 004: Ledger Entries
-- Tracks cover-for-cover obligations between TPs
-- Only created when a COVER adjustment is CONFIRMED

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

-- Users can view ledger entries they're involved in
create policy "Users can view own ledger entries"
  on public.ledger_entries for select
  using (auth.uid() = creditor_id or auth.uid() = debtor_id);

-- Only involved parties can update (settle)
create policy "Involved parties can update ledger entries"
  on public.ledger_entries for update
  using (auth.uid() = creditor_id or auth.uid() = debtor_id);

-- System inserts via server actions (service role)
create policy "Service role can insert ledger entries"
  on public.ledger_entries for insert
  with check (true);

create index idx_ledger_creditor on public.ledger_entries(creditor_id);
create index idx_ledger_debtor on public.ledger_entries(debtor_id);
create index idx_ledger_settled on public.ledger_entries(is_settled);
