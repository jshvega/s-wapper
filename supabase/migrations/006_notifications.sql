-- Migration 006: Notifications
-- Log of all notification events (in-app, email, SMS)

create type notification_type as enum (
  'NEW_MATCH', 'ACCEPTED', 'TIMER_WARNING', 'CONFIRMED',
  'EXPIRED', 'SHIFT_REMINDER', 'OBLIGATION_CREATED'
);
create type notification_channel as enum ('EMAIL', 'SMS', 'IN_APP');
create type notification_status as enum ('PENDING', 'SENT', 'FAILED');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type notification_type not null,
  channel notification_channel not null,
  status notification_status not null default 'PENDING',
  content_summary text,
  related_adjustment_id uuid references public.adjustments(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Server can insert notifications
create policy "Server can insert notifications"
  on public.notifications for insert
  with check (true);

-- Users can update their own notifications (mark read)
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create index idx_notifications_user_status on public.notifications(user_id, status);
create index idx_notifications_pending on public.notifications(status, created_at) where status = 'PENDING';
