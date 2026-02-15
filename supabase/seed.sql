-- SWAPPER Seed Data
-- Demo data for testing. Run AFTER migrations.
-- NOTE: These profiles reference auth.users IDs.
-- In Supabase, create auth users first via the dashboard or auth API,
-- then run this seed with the actual UUIDs substituted.
--
-- For quick demo setup:
-- 1. Register users via the app's /register page
-- 2. Copy their UUIDs from the profiles table
-- 3. Insert their schedules below using actual UUIDs
--
-- OR use the Supabase Dashboard > Authentication > Users to create test users,
-- then run this after updating the UUIDs.

-- ============================================================
-- DEMO SCHEDULES
-- (Replace <USER_UUID_N> with actual user IDs after registration)
-- ============================================================

-- User 1: Mon-Fri, 6am-3pm, Sat+Sun off
-- insert into public.schedules (user_id, day_of_week, shift_start, shift_end, is_day_off, effective_from) values
--   ('<USER_UUID_1>', 'MON', '06:00', '15:00', false, '2026-01-01'),
--   ('<USER_UUID_1>', 'TUE', '06:00', '15:00', false, '2026-01-01'),
--   ('<USER_UUID_1>', 'WED', '06:00', '15:00', false, '2026-01-01'),
--   ('<USER_UUID_1>', 'THU', '06:00', '15:00', false, '2026-01-01'),
--   ('<USER_UUID_1>', 'FRI', '06:00', '15:00', false, '2026-01-01'),
--   ('<USER_UUID_1>', 'SAT', null, null, true, '2026-01-01'),
--   ('<USER_UUID_1>', 'SUN', null, null, true, '2026-01-01');

-- User 2: Mon-Wed, Fri-Sat, 11am-8pm, Thu+Sun off
-- insert into public.schedules (user_id, day_of_week, shift_start, shift_end, is_day_off, effective_from) values
--   ('<USER_UUID_2>', 'MON', '11:00', '20:00', false, '2026-01-01'),
--   ('<USER_UUID_2>', 'TUE', '11:00', '20:00', false, '2026-01-01'),
--   ('<USER_UUID_2>', 'WED', '11:00', '20:00', false, '2026-01-01'),
--   ('<USER_UUID_2>', 'THU', null, null, true, '2026-01-01'),
--   ('<USER_UUID_2>', 'FRI', '11:00', '20:00', false, '2026-01-01'),
--   ('<USER_UUID_2>', 'SAT', '11:00', '20:00', false, '2026-01-01'),
--   ('<USER_UUID_2>', 'SUN', null, null, true, '2026-01-01');

-- User 3: Tue-Sat, 3pm-midnight, Sun+Mon off
-- insert into public.schedules (user_id, day_of_week, shift_start, shift_end, is_day_off, effective_from) values
--   ('<USER_UUID_3>', 'MON', null, null, true, '2026-01-01'),
--   ('<USER_UUID_3>', 'TUE', '15:00', '00:00', false, '2026-01-01'),
--   ('<USER_UUID_3>', 'WED', '15:00', '00:00', false, '2026-01-01'),
--   ('<USER_UUID_3>', 'THU', '15:00', '00:00', false, '2026-01-01'),
--   ('<USER_UUID_3>', 'FRI', '15:00', '00:00', false, '2026-01-01'),
--   ('<USER_UUID_3>', 'SAT', '15:00', '00:00', false, '2026-01-01'),
--   ('<USER_UUID_3>', 'SUN', null, null, true, '2026-01-01');

-- ============================================================
-- DEMO ADJUSTMENTS (after users exist)
-- ============================================================

-- Example: An OPEN swap request
-- insert into public.adjustments (type, listing_type, status, creator_id, date, original_shift_start, original_shift_end, desired_shift_start, desired_shift_end, notes) values
--   ('SWAP', 'REQUEST', 'OPEN', '<USER_UUID_1>', '2026-02-17', '06:00', '15:00', '11:00', '20:00', 'Need an afternoon shift this Tuesday, can trade my 6am.');

-- Example: An OPEN cover offer
-- insert into public.adjustments (type, listing_type, status, creator_id, date, original_shift_start, original_shift_end, notes) values
--   ('COVER', 'OFFER', 'OPEN', '<USER_UUID_3>', '2026-02-20', '15:00', '00:00', 'Available to cover someone on Friday the 20th.');
