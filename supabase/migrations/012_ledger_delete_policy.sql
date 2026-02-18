-- Migration 012: Add DELETE policy to ledger_entries
-- Allows creditors and debtors to delete their own ledger entries
-- (used when a confirmed cover is cancelled to reverse the obligation)

create policy "Involved parties can delete ledger entries"
  on public.ledger_entries for delete
  using (auth.uid() = creditor_id or auth.uid() = debtor_id);
