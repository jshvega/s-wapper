-- S-WAPPER Seed Data
-- Demo/test data for development and demonstrations.
--
-- ═══════════════════════════════════════════════════════════════
-- HOW TO RUN
-- ═══════════════════════════════════════════════════════════════
--
-- OPTION A — Supabase CLI (local dev):
--   supabase db reset          (resets DB and re-runs migrations + seed)
--   — or —
--   supabase db seed           (seed only, no migration reset)
--
-- OPTION B — Supabase SQL Editor (any environment):
--   Paste this entire file into the SQL Editor and click Run.
--   Requires service_role access (Supabase Dashboard SQL Editor has this).
--
-- OPTION C — psql:
--   psql $DATABASE_URL -f supabase/seed.sql
--
-- NOTE: Run AFTER all migrations are applied.
-- NOTE: This inserts directly into auth.users — works in local dev and in
--       the Supabase SQL Editor. For production without SQL Editor access,
--       register users via /register page, then insert only the schedule rows.
--
-- ═══════════════════════════════════════════════════════════════
-- TEST ACCOUNTS  (password for all: TestPassword123!)
-- ═══════════════════════════════════════════════════════════════
--
--  Email                        Name                              Role
--  ────────────────────────────────────────────────────────────────────
--  admin@swapper.test           Ricardo Alejandro Mendez Castillo  ADMIN
--  maria@swapper.test           Maria Luisa Santos Reyes           TP
--  diego@swapper.test           Diego Mateo Garcia Lopez           TP
--  ana@swapper.test             Ana Patricia Rodriguez Morales      TP
--  carlos@swapper.test          Carlos Alberto Vega Torres         TP
--  elena@swapper.test           Elena Sofia Cruz Jimenez           TP
--  roberto@swapper.test         Roberto Luis Herrera Diaz         TP
--  lucia@swapper.test           Lucia Maria Perez Gutierrez       TP
--  miguel@swapper.test          Miguel Angel Flores Ramirez       TP
--  sofia@swapper.test           Sofia Isabel Navarro Blanco       TP
--  javier@swapper.test          Javier Eduardo Ruiz Molina        TP
--  camila@swapper.test          Camila Valentina Morales Soto      TP
--
-- ═══════════════════════════════════════════════════════════════


-- ── Prevent accidental double-seeding ──────────────────────────
do $$ begin
  if exists (
    select 1 from public.profiles where email like '%@swapper.test' limit 1
  ) then
    raise exception 'Seed data already present. Run "supabase db reset" first to reseed.';
  end if;
end $$;

-- ══════════════════════════════════════════════════════════════════
-- STEP 1: Auth Users
-- ══════════════════════════════════════════════════════════════════
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_token, email_change_token_new,
  email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000','11111111-1111-4111-a111-111111111111',
   'authenticated','authenticated','admin@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Ricardo Alejandro Mendez Castillo"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','22222222-2222-4222-a222-222222222222',
   'authenticated','authenticated','maria@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Maria Luisa Santos Reyes"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','33333333-3333-4333-a333-333333333333',
   'authenticated','authenticated','diego@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Diego Mateo Garcia Lopez"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','44444444-4444-4444-a444-444444444444',
   'authenticated','authenticated','ana@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Ana Patricia Rodriguez Morales"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','55555555-5555-4555-a555-555555555555',
   'authenticated','authenticated','carlos@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Carlos Alberto Vega Torres"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','66666666-6666-4666-a666-666666666666',
   'authenticated','authenticated','elena@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Elena Sofia Cruz Jimenez"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','77777777-7777-4777-a777-777777777777',
   'authenticated','authenticated','roberto@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Roberto Luis Herrera Diaz"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','88888888-8888-4888-a888-888888888888',
   'authenticated','authenticated','lucia@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Lucia Maria Perez Gutierrez"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','99999999-9999-4999-a999-999999999999',
   'authenticated','authenticated','miguel@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Miguel Angel Flores Ramirez"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
   'authenticated','authenticated','sofia@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Sofia Isabel Navarro Blanco"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb',
   'authenticated','authenticated','javier@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Javier Eduardo Ruiz Molina"}',
   false,now(),now()),
  ('00000000-0000-0000-0000-000000000000','cccccccc-cccc-4ccc-accc-cccccccccccc',
   'authenticated','authenticated','camila@swapper.test',
   crypt('TestPassword123!',gen_salt('bf')),
   now(),'','','',now(),
   '{"provider":"email","providers":["email"]}','{"name":"Camila Valentina Morales Soto"}',
   false,now(),now());

-- auth.identities (required for email login)
insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
values
  (gen_random_uuid(),'admin@swapper.test',  '11111111-1111-4111-a111-111111111111','{"sub":"11111111-1111-4111-a111-111111111111","email":"admin@swapper.test","email_verified":true}',  'email',now(),now(),now()),
  (gen_random_uuid(),'maria@swapper.test',  '22222222-2222-4222-a222-222222222222','{"sub":"22222222-2222-4222-a222-222222222222","email":"maria@swapper.test","email_verified":true}',  'email',now(),now(),now()),
  (gen_random_uuid(),'diego@swapper.test',  '33333333-3333-4333-a333-333333333333','{"sub":"33333333-3333-4333-a333-333333333333","email":"diego@swapper.test","email_verified":true}',  'email',now(),now(),now()),
  (gen_random_uuid(),'ana@swapper.test',    '44444444-4444-4444-a444-444444444444','{"sub":"44444444-4444-4444-a444-444444444444","email":"ana@swapper.test","email_verified":true}',    'email',now(),now(),now()),
  (gen_random_uuid(),'carlos@swapper.test', '55555555-5555-4555-a555-555555555555','{"sub":"55555555-5555-4555-a555-555555555555","email":"carlos@swapper.test","email_verified":true}', 'email',now(),now(),now()),
  (gen_random_uuid(),'elena@swapper.test',  '66666666-6666-4666-a666-666666666666','{"sub":"66666666-6666-4666-a666-666666666666","email":"elena@swapper.test","email_verified":true}',  'email',now(),now(),now()),
  (gen_random_uuid(),'roberto@swapper.test','77777777-7777-4777-a777-777777777777','{"sub":"77777777-7777-4777-a777-777777777777","email":"roberto@swapper.test","email_verified":true}','email',now(),now(),now()),
  (gen_random_uuid(),'lucia@swapper.test',  '88888888-8888-4888-a888-888888888888','{"sub":"88888888-8888-4888-a888-888888888888","email":"lucia@swapper.test","email_verified":true}',  'email',now(),now(),now()),
  (gen_random_uuid(),'miguel@swapper.test', '99999999-9999-4999-a999-999999999999','{"sub":"99999999-9999-4999-a999-999999999999","email":"miguel@swapper.test","email_verified":true}', 'email',now(),now(),now()),
  (gen_random_uuid(),'sofia@swapper.test',  'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','{"sub":"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa","email":"sofia@swapper.test","email_verified":true}',  'email',now(),now(),now()),
  (gen_random_uuid(),'javier@swapper.test', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','{"sub":"bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb","email":"javier@swapper.test","email_verified":true}', 'email',now(),now(),now()),
  (gen_random_uuid(),'camila@swapper.test', 'cccccccc-cccc-4ccc-accc-cccccccccccc','{"sub":"cccccccc-cccc-4ccc-accc-cccccccccccc","email":"camila@swapper.test","email_verified":true}', 'email',now(),now(),now());


-- ══════════════════════════════════════════════════════════════════
-- STEP 2: Profiles
-- ══════════════════════════════════════════════════════════════════
insert into public.profiles (id, email, name, role, is_active, created_at, updated_at)
values
  ('11111111-1111-4111-a111-111111111111','admin@swapper.test',  'Ricardo Alejandro Mendez Castillo','ADMIN',true,now(),now()),
  ('22222222-2222-4222-a222-222222222222','maria@swapper.test',  'Maria Luisa Santos Reyes',         'TP',  true,now(),now()),
  ('33333333-3333-4333-a333-333333333333','diego@swapper.test',  'Diego Mateo Garcia Lopez',         'TP',  true,now(),now()),
  ('44444444-4444-4444-a444-444444444444','ana@swapper.test',    'Ana Patricia Rodriguez Morales',   'TP',  true,now(),now()),
  ('55555555-5555-4555-a555-555555555555','carlos@swapper.test', 'Carlos Alberto Vega Torres',       'TP',  true,now(),now()),
  ('66666666-6666-4666-a666-666666666666','elena@swapper.test',  'Elena Sofia Cruz Jimenez',         'TP',  true,now(),now()),
  ('77777777-7777-4777-a777-777777777777','roberto@swapper.test','Roberto Luis Herrera Diaz',        'TP',  true,now(),now()),
  ('88888888-8888-4888-a888-888888888888','lucia@swapper.test',  'Lucia Maria Perez Gutierrez',      'TP',  true,now(),now()),
  ('99999999-9999-4999-a999-999999999999','miguel@swapper.test', 'Miguel Angel Flores Ramirez',      'TP',  true,now(),now()),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','sofia@swapper.test',  'Sofia Isabel Navarro Blanco',      'TP',  true,now(),now()),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','javier@swapper.test', 'Javier Eduardo Ruiz Molina',       'TP',  true,now(),now()),
  ('cccccccc-cccc-4ccc-accc-cccccccccccc','camila@swapper.test', 'Camila Valentina Morales Soto',    'TP',  true,now(),now());


-- ══════════════════════════════════════════════════════════════════
-- STEP 3: Schedules (7 rows per user = 84 total)
-- ══════════════════════════════════════════════════════════════════
-- Each TP: exactly 5 work days + 2 days off.
--
--  User        MON         TUE         WED         THU         FRI         SAT         SUN
--  ──────────  ──────────  ──────────  ──────────  ──────────  ──────────  ──────────  ──────────
--  Ricardo     09:00-18    09:00-18    09:00-18    09:00-18    09:00-18    OFF         OFF
--  Maria       05:30-14:30 05:30-14:30 05:30-14:30 05:30-14:30 05:30-14:30 OFF         OFF
--  Diego       07:00-16    07:00-16    07:00-16    OFF         07:00-16    07:00-16    OFF
--  Ana         OFF         15:00-00    15:00-00    15:00-00    15:00-00    15:00-00    OFF
--  Carlos      10:00-19    10:00-19    OFF         10:00-19    10:00-19    10:00-19    OFF
--  Elena       OFF         OFF         22:00-06    22:00-06    22:00-06    22:00-06    22:00-06
--  Roberto     06:00-15    06:00-15    06:00-15    OFF         06:00-15    06:00-15    OFF
--  Lucia       14:00-23    14:00-23    14:00-23    14:00-23    OFF         14:00-23    OFF
--  Miguel      08:00-17    08:00-17    08:00-17    08:00-17    08:00-17    OFF         OFF
--  Sofia       OFF         16:00-01    16:00-01    16:00-01    16:00-01    16:00-01    OFF
--  Javier      11:00-20    OFF         11:00-20    11:00-20    11:00-20    11:00-20    OFF
--  Camila      04:00-13    04:00-13    04:00-13    04:00-13    04:00-13    OFF         OFF

insert into public.schedules (user_id, day_of_week, shift_start, shift_end, is_day_off, effective_from)
values
  -- Ricardo (admin)
  ('11111111-1111-4111-a111-111111111111','MON','09:00','18:00',false,'2026-01-01'),
  ('11111111-1111-4111-a111-111111111111','TUE','09:00','18:00',false,'2026-01-01'),
  ('11111111-1111-4111-a111-111111111111','WED','09:00','18:00',false,'2026-01-01'),
  ('11111111-1111-4111-a111-111111111111','THU','09:00','18:00',false,'2026-01-01'),
  ('11111111-1111-4111-a111-111111111111','FRI','09:00','18:00',false,'2026-01-01'),
  ('11111111-1111-4111-a111-111111111111','SAT',null,null,true,'2026-01-01'),
  ('11111111-1111-4111-a111-111111111111','SUN',null,null,true,'2026-01-01'),
  -- Maria (early bird, days off: Sat+Sun)
  ('22222222-2222-4222-a222-222222222222','MON','05:30','14:30',false,'2026-01-01'),
  ('22222222-2222-4222-a222-222222222222','TUE','05:30','14:30',false,'2026-01-01'),
  ('22222222-2222-4222-a222-222222222222','WED','05:30','14:30',false,'2026-01-01'),
  ('22222222-2222-4222-a222-222222222222','THU','05:30','14:30',false,'2026-01-01'),
  ('22222222-2222-4222-a222-222222222222','FRI','05:30','14:30',false,'2026-01-01'),
  ('22222222-2222-4222-a222-222222222222','SAT',null,null,true,'2026-01-01'),
  ('22222222-2222-4222-a222-222222222222','SUN',null,null,true,'2026-01-01'),
  -- Diego (days off: Thu+Sun)
  ('33333333-3333-4333-a333-333333333333','MON','07:00','16:00',false,'2026-01-01'),
  ('33333333-3333-4333-a333-333333333333','TUE','07:00','16:00',false,'2026-01-01'),
  ('33333333-3333-4333-a333-333333333333','WED','07:00','16:00',false,'2026-01-01'),
  ('33333333-3333-4333-a333-333333333333','THU',null,null,true,'2026-01-01'),
  ('33333333-3333-4333-a333-333333333333','FRI','07:00','16:00',false,'2026-01-01'),
  ('33333333-3333-4333-a333-333333333333','SAT','07:00','16:00',false,'2026-01-01'),
  ('33333333-3333-4333-a333-333333333333','SUN',null,null,true,'2026-01-01'),
  -- Ana (afternoon crew, days off: Sun+Mon)
  ('44444444-4444-4444-a444-444444444444','MON',null,null,true,'2026-01-01'),
  ('44444444-4444-4444-a444-444444444444','TUE','15:00','00:00',false,'2026-01-01'),
  ('44444444-4444-4444-a444-444444444444','WED','15:00','00:00',false,'2026-01-01'),
  ('44444444-4444-4444-a444-444444444444','THU','15:00','00:00',false,'2026-01-01'),
  ('44444444-4444-4444-a444-444444444444','FRI','15:00','00:00',false,'2026-01-01'),
  ('44444444-4444-4444-a444-444444444444','SAT','15:00','00:00',false,'2026-01-01'),
  ('44444444-4444-4444-a444-444444444444','SUN',null,null,true,'2026-01-01'),
  -- Carlos (days off: Wed+Sun)
  ('55555555-5555-4555-a555-555555555555','MON','10:00','19:00',false,'2026-01-01'),
  ('55555555-5555-4555-a555-555555555555','TUE','10:00','19:00',false,'2026-01-01'),
  ('55555555-5555-4555-a555-555555555555','WED',null,null,true,'2026-01-01'),
  ('55555555-5555-4555-a555-555555555555','THU','10:00','19:00',false,'2026-01-01'),
  ('55555555-5555-4555-a555-555555555555','FRI','10:00','19:00',false,'2026-01-01'),
  ('55555555-5555-4555-a555-555555555555','SAT','10:00','19:00',false,'2026-01-01'),
  ('55555555-5555-4555-a555-555555555555','SUN',null,null,true,'2026-01-01'),
  -- Elena (night crew, days off: Mon+Tue)
  ('66666666-6666-4666-a666-666666666666','MON',null,null,true,'2026-01-01'),
  ('66666666-6666-4666-a666-666666666666','TUE',null,null,true,'2026-01-01'),
  ('66666666-6666-4666-a666-666666666666','WED','22:00','06:00',false,'2026-01-01'),
  ('66666666-6666-4666-a666-666666666666','THU','22:00','06:00',false,'2026-01-01'),
  ('66666666-6666-4666-a666-666666666666','FRI','22:00','06:00',false,'2026-01-01'),
  ('66666666-6666-4666-a666-666666666666','SAT','22:00','06:00',false,'2026-01-01'),
  ('66666666-6666-4666-a666-666666666666','SUN','22:00','06:00',false,'2026-01-01'),
  -- Roberto (days off: Thu+Sun)
  ('77777777-7777-4777-a777-777777777777','MON','06:00','15:00',false,'2026-01-01'),
  ('77777777-7777-4777-a777-777777777777','TUE','06:00','15:00',false,'2026-01-01'),
  ('77777777-7777-4777-a777-777777777777','WED','06:00','15:00',false,'2026-01-01'),
  ('77777777-7777-4777-a777-777777777777','THU',null,null,true,'2026-01-01'),
  ('77777777-7777-4777-a777-777777777777','FRI','06:00','15:00',false,'2026-01-01'),
  ('77777777-7777-4777-a777-777777777777','SAT','06:00','15:00',false,'2026-01-01'),
  ('77777777-7777-4777-a777-777777777777','SUN',null,null,true,'2026-01-01'),
  -- Lucia (days off: Fri+Sun)
  ('88888888-8888-4888-a888-888888888888','MON','14:00','23:00',false,'2026-01-01'),
  ('88888888-8888-4888-a888-888888888888','TUE','14:00','23:00',false,'2026-01-01'),
  ('88888888-8888-4888-a888-888888888888','WED','14:00','23:00',false,'2026-01-01'),
  ('88888888-8888-4888-a888-888888888888','THU','14:00','23:00',false,'2026-01-01'),
  ('88888888-8888-4888-a888-888888888888','FRI',null,null,true,'2026-01-01'),
  ('88888888-8888-4888-a888-888888888888','SAT','14:00','23:00',false,'2026-01-01'),
  ('88888888-8888-4888-a888-888888888888','SUN',null,null,true,'2026-01-01'),
  -- Miguel (days off: Sat+Sun)
  ('99999999-9999-4999-a999-999999999999','MON','08:00','17:00',false,'2026-01-01'),
  ('99999999-9999-4999-a999-999999999999','TUE','08:00','17:00',false,'2026-01-01'),
  ('99999999-9999-4999-a999-999999999999','WED','08:00','17:00',false,'2026-01-01'),
  ('99999999-9999-4999-a999-999999999999','THU','08:00','17:00',false,'2026-01-01'),
  ('99999999-9999-4999-a999-999999999999','FRI','08:00','17:00',false,'2026-01-01'),
  ('99999999-9999-4999-a999-999999999999','SAT',null,null,true,'2026-01-01'),
  ('99999999-9999-4999-a999-999999999999','SUN',null,null,true,'2026-01-01'),
  -- Sofia (late afternoon, days off: Sun+Mon)
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','MON',null,null,true,'2026-01-01'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','TUE','16:00','01:00',false,'2026-01-01'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','WED','16:00','01:00',false,'2026-01-01'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','THU','16:00','01:00',false,'2026-01-01'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','FRI','16:00','01:00',false,'2026-01-01'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','SAT','16:00','01:00',false,'2026-01-01'),
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','SUN',null,null,true,'2026-01-01'),
  -- Javier (days off: Tue+Sun)
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','MON','11:00','20:00',false,'2026-01-01'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','TUE',null,null,true,'2026-01-01'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','WED','11:00','20:00',false,'2026-01-01'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','THU','11:00','20:00',false,'2026-01-01'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','FRI','11:00','20:00',false,'2026-01-01'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','SAT','11:00','20:00',false,'2026-01-01'),
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','SUN',null,null,true,'2026-01-01'),
  -- Camila (very early, days off: Sat+Sun)
  ('cccccccc-cccc-4ccc-accc-cccccccccccc','MON','04:00','13:00',false,'2026-01-01'),
  ('cccccccc-cccc-4ccc-accc-cccccccccccc','TUE','04:00','13:00',false,'2026-01-01'),
  ('cccccccc-cccc-4ccc-accc-cccccccccccc','WED','04:00','13:00',false,'2026-01-01'),
  ('cccccccc-cccc-4ccc-accc-cccccccccccc','THU','04:00','13:00',false,'2026-01-01'),
  ('cccccccc-cccc-4ccc-accc-cccccccccccc','FRI','04:00','13:00',false,'2026-01-01'),
  ('cccccccc-cccc-4ccc-accc-cccccccccccc','SAT',null,null,true,'2026-01-01'),
  ('cccccccc-cccc-4ccc-accc-cccccccccccc','SUN',null,null,true,'2026-01-01');


-- ══════════════════════════════════════════════════════════════════
-- STEP 4: Adjustments (reference date: Wed Feb 18, 2026)
-- ══════════════════════════════════════════════════════════════════
-- adj01  OPEN   Maria    SWAP REQUEST   Mon Feb 23  05:30-14:30 → wants 11:00-20:00
-- adj02  OPEN   Ana      COVER REQUEST  Thu Feb 26  15:00-00:00
-- adj03  OPEN   Miguel   COVER REQUEST  Fri Feb 20  08:00-17:00
-- adj04  OPEN   Javier   SWAP OFFER     Mon Feb 23  11:00-20:00
-- adj05  OPEN   Elena    COVER OFFER    Sat Feb 28  22:00-06:00
-- adj06  PEND   Diego    COVER REQUEST  Mon Mar 2   07:00-16:00  (Sofia covers; Mon=her day off)
-- adj07  CONF   Sofia    COVER REQUEST  Tue Feb 10  16:00-01:00  (Javier covers; Tue=his day off) → ledger
-- adj08  CONF   Maria    SWAP REQUEST   Thu Feb 12  05:30-14:30  (Carlos accepts)                → no ledger
-- adj09  CONF   Camila   COVER REQUEST  Thu Feb 5   04:00-13:00  (Roberto covers; Thu=his off)   → ledger
-- adj10  EXPD   Elena    COVER REQUEST  Sat Feb 7   22:00-06:00  (Maria accepted; Sat=her off; expired)
-- adj11  DRAFT  Ricardo  SWAP REQUEST   Mon Mar 9   09:00-18:00  (unpublished)
-- adj12  CONF   Miguel   COVER REQUEST  Fri Jan 30  08:00-17:00  (Lucia covers; Fri=her off)     → ledger

insert into public.adjustments (
  id, type, listing_type, status,
  creator_id, accepter_id, date,
  original_shift_start, original_shift_end,
  desired_shift_start, desired_shift_end,
  notes, aspect_trade_id,
  accepted_at, confirmed_at, expires_at,
  created_at, updated_at
) values
  -- adj01
  ('d1d1d1d1-d1d1-4d1d-a1d1-d1d1d1d1d1d1','SWAP','REQUEST','OPEN',
   '22222222-2222-4222-a222-222222222222',null,'2026-02-23',
   '05:30','14:30','11:00','20:00',
   'Need afternoon shift Mon Feb 23. Happy to trade my early 5:30 AM start.',
   null,null,null,null, now()-'2 days'::interval, now()-'2 days'::interval),
  -- adj02
  ('d2d2d2d2-d2d2-4d2d-a2d2-d2d2d2d2d2d2','COVER','REQUEST','OPEN',
   '44444444-4444-4444-a444-444444444444',null,'2026-02-26',
   '15:00','00:00',null,null,
   'Family commitment Thu Feb 26. Can offer a cover in return.',
   null,null,null,null, now()-'1 day'::interval, now()-'1 day'::interval),
  -- adj03
  ('d3d3d3d3-d3d3-4d3d-a3d3-d3d3d3d3d3d3','COVER','REQUEST','OPEN',
   '99999999-9999-4999-a999-999999999999',null,'2026-02-20',
   '08:00','17:00',null,null,
   'Doctor appointment on Friday morning — needs full-day coverage.',
   null,null,null,null, now()-'3 hours'::interval, now()-'3 hours'::interval),
  -- adj04
  ('d4d4d4d4-d4d4-4d4d-a4d4-d4d4d4d4d4d4','SWAP','OFFER','OPEN',
   'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb',null,'2026-02-23',
   '11:00','20:00',null,null,
   'Offering my Mon Feb 23 shift (11-8). Looking for a morning swap.',
   null,null,null,null, now()-'5 hours'::interval, now()-'5 hours'::interval),
  -- adj05
  ('d5d5d5d5-d5d5-4d5d-a5d5-d5d5d5d5d5d5','COVER','OFFER','OPEN',
   '66666666-6666-4666-a666-666666666666',null,'2026-02-28',
   '22:00','06:00',null,null,
   'Available to cover a Sat night shift Feb 28. Prefer 10pm-6am range.',
   null,null,null,null, now()-'12 hours'::interval, now()-'12 hours'::interval),
  -- adj06 — PENDING_CONFIRMATION (accepted 2h ago, expires in ~22h)
  ('d6d6d6d6-d6d6-4d6d-a6d6-d6d6d6d6d6d6','COVER','REQUEST','PENDING_CONFIRMATION',
   '33333333-3333-4333-a333-333333333333','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','2026-03-02',
   '07:00','16:00',null,null,
   'Need coverage Mon Mar 2. Sofia, thank you!',
   null,
   now()-'2 hours'::interval, null, now()-'2 hours'::interval+'24 hours'::interval,
   now()-'1 day'::interval, now()-'2 hours'::interval),
  -- adj07 — CONFIRMED COVER (Sofia requested, Javier covered on his day off)
  ('d7d7d7d7-d7d7-4d7d-a7d7-d7d7d7d7d7d7','COVER','REQUEST','CONFIRMED',
   'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','2026-02-10',
   '16:00','01:00',null,null,'Covered by Javier. Thanks!',
   'TRK-20260210-4481',
   '2026-02-09 18:00:00+00','2026-02-09 20:30:00+00','2026-02-10 18:00:00+00',
   '2026-02-08 09:00:00+00','2026-02-09 20:30:00+00'),
  -- adj08 — CONFIRMED SWAP (Maria and Carlos both work Thu)
  ('d8d8d8d8-d8d8-4d8d-a8d8-d8d8d8d8d8d8','SWAP','REQUEST','CONFIRMED',
   '22222222-2222-4222-a222-222222222222','55555555-5555-4555-a555-555555555555','2026-02-12',
   '05:30','14:30','10:00','19:00','Thanks Carlos for the swap!',
   'TRK-20260212-2293',
   '2026-02-10 14:00:00+00','2026-02-10 14:45:00+00','2026-02-11 14:00:00+00',
   '2026-02-09 10:00:00+00','2026-02-10 14:45:00+00'),
  -- adj09 — CONFIRMED COVER (Camila requested, Roberto covered on his Thu day off)
  ('d9d9d9d9-d9d9-4d9d-a9d9-d9d9d9d9d9d9','COVER','REQUEST','CONFIRMED',
   'cccccccc-cccc-4ccc-accc-cccccccccccc','77777777-7777-4777-a777-777777777777','2026-02-05',
   '04:00','13:00',null,null,'Roberto saved me! I owe you one.',
   'TRK-20260205-7712',
   '2026-02-03 20:00:00+00','2026-02-03 20:15:00+00','2026-02-04 20:00:00+00',
   '2026-02-02 11:00:00+00','2026-02-03 20:15:00+00'),
  -- adj10 — EXPIRED (Elena requested, Maria accepted but neither confirmed within 24h)
  ('dadadada-dada-4dad-adad-dadadadadada','COVER','REQUEST','EXPIRED',
   '66666666-6666-4666-a666-666666666666','22222222-2222-4222-a222-222222222222','2026-02-07',
   '22:00','06:00',null,null,'Need someone for Saturday night shift.',
   null,
   '2026-02-07 20:00:00+00',null,'2026-02-08 20:00:00+00',
   '2026-02-06 10:00:00+00','2026-02-08 20:00:00+00'),
  -- adj11 — DRAFT (unpublished)
  ('dbdbdbdb-dbdb-4dbd-abdb-dbdbdbdbdbdb','SWAP','REQUEST','DRAFT',
   '11111111-1111-4111-a111-111111111111',null,'2026-03-09',
   '09:00','18:00','14:00','23:00',
   'Thinking of swapping my Mon for an afternoon shift.',
   null,null,null,null, now()-'30 minutes'::interval, now()-'30 minutes'::interval),
  -- adj12 — CONFIRMED COVER (Miguel requested, Lucia covered on her Fri day off)
  ('dcdcdcdc-dcdc-4dcd-adcd-dcdcdcdcdcdc','COVER','REQUEST','CONFIRMED',
   '99999999-9999-4999-a999-999999999999','88888888-8888-4888-a888-888888888888','2026-01-30',
   '08:00','17:00',null,null,'Lucia covered for me. Settled in cash — thanks!',
   'TRK-20260130-0034',
   '2026-01-28 16:00:00+00','2026-01-28 16:30:00+00','2026-01-29 16:00:00+00',
   '2026-01-27 09:00:00+00','2026-01-28 16:30:00+00');


-- ══════════════════════════════════════════════════════════════════
-- STEP 5: Adjustment Logs
-- ══════════════════════════════════════════════════════════════════
insert into public.adjustment_logs (adjustment_id, action, actor_id, metadata, created_at)
values
  -- adj01 (OPEN)
  ('d1d1d1d1-d1d1-4d1d-a1d1-d1d1d1d1d1d1','CREATED',  '22222222-2222-4222-a222-222222222222','{}',now()-'2 days'::interval),
  ('d1d1d1d1-d1d1-4d1d-a1d1-d1d1d1d1d1d1','PUBLISHED','22222222-2222-4222-a222-222222222222','{}',now()-'2 days'::interval+'5 minutes'::interval),
  -- adj02 (OPEN)
  ('d2d2d2d2-d2d2-4d2d-a2d2-d2d2d2d2d2d2','CREATED',  '44444444-4444-4444-a444-444444444444','{}',now()-'1 day'::interval),
  ('d2d2d2d2-d2d2-4d2d-a2d2-d2d2d2d2d2d2','PUBLISHED','44444444-4444-4444-a444-444444444444','{}',now()-'1 day'::interval+'2 minutes'::interval),
  -- adj03 (OPEN)
  ('d3d3d3d3-d3d3-4d3d-a3d3-d3d3d3d3d3d3','CREATED',  '99999999-9999-4999-a999-999999999999','{}',now()-'3 hours'::interval),
  ('d3d3d3d3-d3d3-4d3d-a3d3-d3d3d3d3d3d3','PUBLISHED','99999999-9999-4999-a999-999999999999','{}',now()-'3 hours'::interval+'1 minute'::interval),
  -- adj04 (OPEN)
  ('d4d4d4d4-d4d4-4d4d-a4d4-d4d4d4d4d4d4','CREATED',  'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','{}',now()-'5 hours'::interval),
  ('d4d4d4d4-d4d4-4d4d-a4d4-d4d4d4d4d4d4','PUBLISHED','bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','{}',now()-'5 hours'::interval+'3 minutes'::interval),
  -- adj05 (OPEN)
  ('d5d5d5d5-d5d5-4d5d-a5d5-d5d5d5d5d5d5','CREATED',  '66666666-6666-4666-a666-666666666666','{}',now()-'12 hours'::interval),
  ('d5d5d5d5-d5d5-4d5d-a5d5-d5d5d5d5d5d5','PUBLISHED','66666666-6666-4666-a666-666666666666','{}',now()-'12 hours'::interval+'2 minutes'::interval),
  -- adj06 (PENDING)
  ('d6d6d6d6-d6d6-4d6d-a6d6-d6d6d6d6d6d6','CREATED',  '33333333-3333-4333-a333-333333333333','{}',now()-'1 day'::interval),
  ('d6d6d6d6-d6d6-4d6d-a6d6-d6d6d6d6d6d6','PUBLISHED','33333333-3333-4333-a333-333333333333','{}',now()-'1 day'::interval+'5 minutes'::interval),
  ('d6d6d6d6-d6d6-4d6d-a6d6-d6d6d6d6d6d6','ACCEPTED', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','{"accepter_name":"Sofia Isabel Navarro Blanco"}',now()-'2 hours'::interval),
  -- adj07 (CONFIRMED COVER)
  ('d7d7d7d7-d7d7-4d7d-a7d7-d7d7d7d7d7d7','CREATED',  'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','{}','2026-02-08 09:00:00+00'),
  ('d7d7d7d7-d7d7-4d7d-a7d7-d7d7d7d7d7d7','PUBLISHED','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','{}','2026-02-08 09:05:00+00'),
  ('d7d7d7d7-d7d7-4d7d-a7d7-d7d7d7d7d7d7','ACCEPTED', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','{"accepter_name":"Javier Eduardo Ruiz Molina"}','2026-02-09 18:00:00+00'),
  ('d7d7d7d7-d7d7-4d7d-a7d7-d7d7d7d7d7d7','CONFIRMED','bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','{"trade_id":"TRK-20260210-4481"}','2026-02-09 20:30:00+00'),
  -- adj08 (CONFIRMED SWAP)
  ('d8d8d8d8-d8d8-4d8d-a8d8-d8d8d8d8d8d8','CREATED',  '22222222-2222-4222-a222-222222222222','{}','2026-02-09 10:00:00+00'),
  ('d8d8d8d8-d8d8-4d8d-a8d8-d8d8d8d8d8d8','PUBLISHED','22222222-2222-4222-a222-222222222222','{}','2026-02-09 10:10:00+00'),
  ('d8d8d8d8-d8d8-4d8d-a8d8-d8d8d8d8d8d8','ACCEPTED', '55555555-5555-4555-a555-555555555555','{"accepter_name":"Carlos Alberto Vega Torres"}','2026-02-10 14:00:00+00'),
  ('d8d8d8d8-d8d8-4d8d-a8d8-d8d8d8d8d8d8','CONFIRMED','22222222-2222-4222-a222-222222222222','{"trade_id":"TRK-20260212-2293"}','2026-02-10 14:45:00+00'),
  -- adj09 (CONFIRMED COVER)
  ('d9d9d9d9-d9d9-4d9d-a9d9-d9d9d9d9d9d9','CREATED',  'cccccccc-cccc-4ccc-accc-cccccccccccc','{}','2026-02-02 11:00:00+00'),
  ('d9d9d9d9-d9d9-4d9d-a9d9-d9d9d9d9d9d9','PUBLISHED','cccccccc-cccc-4ccc-accc-cccccccccccc','{}','2026-02-02 11:05:00+00'),
  ('d9d9d9d9-d9d9-4d9d-a9d9-d9d9d9d9d9d9','ACCEPTED', '77777777-7777-4777-a777-777777777777','{"accepter_name":"Roberto Luis Herrera Diaz"}','2026-02-03 20:00:00+00'),
  ('d9d9d9d9-d9d9-4d9d-a9d9-d9d9d9d9d9d9','CONFIRMED','77777777-7777-4777-a777-777777777777','{"trade_id":"TRK-20260205-7712"}','2026-02-03 20:15:00+00'),
  -- adj10 (EXPIRED)
  ('dadadada-dada-4dad-adad-dadadadadada','CREATED',  '66666666-6666-4666-a666-666666666666','{}','2026-02-06 10:00:00+00'),
  ('dadadada-dada-4dad-adad-dadadadadada','PUBLISHED','66666666-6666-4666-a666-666666666666','{}','2026-02-06 10:03:00+00'),
  ('dadadada-dada-4dad-adad-dadadadadada','ACCEPTED', '22222222-2222-4222-a222-222222222222','{"accepter_name":"Maria Luisa Santos Reyes"}','2026-02-07 20:00:00+00'),
  ('dadadada-dada-4dad-adad-dadadadadada','EXPIRED',  null,'{"reason":"24_hour_window_elapsed"}','2026-02-08 20:00:00+00'),
  -- adj11 (DRAFT — no PUBLISHED log)
  ('dbdbdbdb-dbdb-4dbd-abdb-dbdbdbdbdbdb','CREATED','11111111-1111-4111-a111-111111111111','{}',now()-'30 minutes'::interval),
  -- adj12 (CONFIRMED COVER)
  ('dcdcdcdc-dcdc-4dcd-adcd-dcdcdcdcdcdc','CREATED',  '99999999-9999-4999-a999-999999999999','{}','2026-01-27 09:00:00+00'),
  ('dcdcdcdc-dcdc-4dcd-adcd-dcdcdcdcdcdc','PUBLISHED','99999999-9999-4999-a999-999999999999','{}','2026-01-27 09:05:00+00'),
  ('dcdcdcdc-dcdc-4dcd-adcd-dcdcdcdcdcdc','ACCEPTED', '88888888-8888-4888-a888-888888888888','{"accepter_name":"Lucia Maria Perez Gutierrez"}','2026-01-28 16:00:00+00'),
  ('dcdcdcdc-dcdc-4dcd-adcd-dcdcdcdcdcdc','CONFIRMED','99999999-9999-4999-a999-999999999999','{"trade_id":"TRK-20260130-0034"}','2026-01-28 16:30:00+00');


-- ══════════════════════════════════════════════════════════════════
-- STEP 6: Ledger Entries
-- ══════════════════════════════════════════════════════════════════
-- Only for CONFIRMED COVER adjustments.
-- creditor = gave the cover · debtor = received it

insert into public.ledger_entries (id, creditor_id, debtor_id, adjustment_id, is_settled, settled_at, settlement_type, created_at)
values
  -- le01: Javier covered Sofia (Feb 10) — UNSETTLED. Sofia owes Javier 1 cover.
  ('e1e1e1e1-e1e1-4e1e-a1e1-e1e1e1e1e1e1',
   'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb',  -- creditor: Javier
   'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',  -- debtor: Sofia
   'd7d7d7d7-d7d7-4d7d-a7d7-d7d7d7d7d7d7',
   false,null,null,'2026-02-09 20:30:00+00'),
  -- le02: Roberto covered Camila (Feb 5) — SETTLED via cover returned Feb 14.
  ('e2e2e2e2-e2e2-4e2e-a2e2-e2e2e2e2e2e2',
   '77777777-7777-4777-a777-777777777777',  -- creditor: Roberto
   'cccccccc-cccc-4ccc-accc-cccccccccccc',  -- debtor: Camila
   'd9d9d9d9-d9d9-4d9d-a9d9-d9d9d9d9d9d9',
   true,'2026-02-14 10:00:00+00','COVER_RETURNED','2026-02-03 20:15:00+00'),
  -- le03: Lucia covered Miguel (Jan 30) — SETTLED via cash Feb 7.
  ('e3e3e3e3-e3e3-4e3e-a3e3-e3e3e3e3e3e3',
   '88888888-8888-4888-a888-888888888888',  -- creditor: Lucia
   '99999999-9999-4999-a999-999999999999',  -- debtor: Miguel
   'dcdcdcdc-dcdc-4dcd-adcd-dcdcdcdcdcdc',
   true,'2026-02-07 14:00:00+00','CASH','2026-01-28 16:30:00+00');


-- ══════════════════════════════════════════════════════════════════
-- Seed complete!
-- ══════════════════════════════════════════════════════════════════
--   12 users (1 ADMIN + 11 TPs) · password: TestPassword123!
--   84 schedule rows (7 days × 12 users)
--   12 adjustments: 5 OPEN · 1 PENDING · 4 CONFIRMED · 1 EXPIRED · 1 DRAFT
--   31 audit log entries
--    3 ledger entries: 1 unsettled (Javier→Sofia) · 2 settled
-- ══════════════════════════════════════════════════════════════════
