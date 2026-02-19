-- Migration 015: Allow admins to read all ledger entries
--
-- The existing SELECT policy on ledger_entries restricts visibility to the
-- creditor or debtor involved in each entry:
--   "Users can view own ledger entries" → auth.uid() = creditor_id OR debtor_id
--
-- This means an admin viewing another user's profile page cannot see that
-- user's ledger entries because the admin's auth.uid() is not in those rows.
-- As a result, the admin user-profile page always shows 0/0 for ledger balance.
--
-- Fix: add a secondary SELECT policy granting admins full read access.

create policy "Admins can view all ledger entries"
  on public.ledger_entries for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );
