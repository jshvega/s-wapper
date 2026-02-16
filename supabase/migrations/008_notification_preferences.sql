-- Migration 008: Notification Preferences
-- Stores per-user notification preferences as JSONB on profiles.
-- Default: all notifications enabled for email, all disabled for SMS.

alter table public.profiles
  add column notification_preferences jsonb not null default '{
    "email": {
      "accepted": true,
      "timer_warning": true,
      "confirmed": true,
      "expired": true,
      "shift_reminder": true,
      "obligation_created": true
    },
    "sms": {
      "accepted": false,
      "timer_warning": false,
      "confirmed": false,
      "expired": false,
      "shift_reminder": false,
      "obligation_created": false
    }
  }'::jsonb;
