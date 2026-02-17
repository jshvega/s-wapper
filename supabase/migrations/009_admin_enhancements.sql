-- Migration 009: Admin Panel Enhancements
-- Add admin-specific log actions and RLS policies for admin access

-- Add new log_action enum values for admin actions
alter type log_action add value if not exists 'ADMIN_FORCE_EXPIRED';
alter type log_action add value if not exists 'ADMIN_FORCE_CONFIRMED';
alter type log_action add value if not exists 'ADMIN_NOTE';

-- Allow admins to view ALL adjustment logs (not just ones they're involved in)
create policy "Admins can view all logs"
  on public.adjustment_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Allow admins to view all adjustments (regardless of involvement)
create policy "Admins can view all adjustments"
  on public.adjustments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Allow admins to update any adjustment (for force expire/confirm)
create policy "Admins can update any adjustment"
  on public.adjustments for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Allow admins to view all ledger entries
create policy "Admins can view all ledger entries"
  on public.ledger_entries for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Allow admins to view all schedules
create policy "Admins can view all schedules"
  on public.schedules for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Allow admins to update any profile (for deactivate/reactivate, role change)
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );
