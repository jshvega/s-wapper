-- Migration 010: Rename aspect_track_id → aspect_trade_id and add CANCELLED status
-- Also adds CANCELLED log_action

-- Rename the column
alter table public.adjustments rename column aspect_track_id to aspect_trade_id;

-- Add CANCELLED to adjustment_status enum
alter type adjustment_status add value if not exists 'CANCELLED';

-- Add CANCELLED to log_action enum
alter type log_action add value if not exists 'CANCELLED';
