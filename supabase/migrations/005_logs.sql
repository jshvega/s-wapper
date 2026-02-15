-- Migration 005: Adjustment Logs
-- Lightweight audit trail for all state changes

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

-- Anyone involved in the adjustment can view its logs
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

-- Server actions can insert logs
create policy "Authenticated users can insert logs"
  on public.adjustment_logs for insert
  with check (auth.uid() is not null);

create index idx_logs_adjustment on public.adjustment_logs(adjustment_id);
create index idx_logs_actor on public.adjustment_logs(actor_id);
