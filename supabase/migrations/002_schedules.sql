-- Migration 002: Schedules
-- Base weekly schedule for each TP

create type day_of_week as enum ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week day_of_week not null,
  shift_start time,
  shift_end time,
  is_day_off boolean not null default false,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),

  -- Either day off (no times) or workday (with times)
  constraint valid_shift check (
    (is_day_off = true and shift_start is null and shift_end is null) or
    (is_day_off = false and shift_start is not null and shift_end is not null)
  ),

  unique(user_id, day_of_week, effective_from)
);

alter table public.schedules enable row level security;

-- Anyone can view all schedules (needed for directory + rule checking)
create policy "Anyone can view schedules"
  on public.schedules for select
  using (true);

-- Users can only manage their own schedules
create policy "Users can insert own schedule"
  on public.schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own schedule"
  on public.schedules for update
  using (auth.uid() = user_id);

create policy "Users can delete own schedule"
  on public.schedules for delete
  using (auth.uid() = user_id);

create index idx_schedules_user on public.schedules(user_id);
