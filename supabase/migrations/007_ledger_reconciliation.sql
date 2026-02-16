-- Migration 007: Ledger Auto-Reconciliation
-- Adds fields to support automatic cover-for-cover reconciliation
-- and safe reversal when a confirmed cover is cancelled (Phase 9).

-- Points to the other ledger entry this was auto-reconciled with
alter table public.ledger_entries
  add column reconciled_with_id uuid references public.ledger_entries(id) on delete set null;

-- true = settled by the system via auto-reconciliation (can be reversed on cancel)
-- false/null = settled manually by a user (Cash, Forgiven, or manual Cover Returned)
alter table public.ledger_entries
  add column auto_reconciled boolean not null default false;

create index idx_ledger_reconciled_with on public.ledger_entries(reconciled_with_id);
