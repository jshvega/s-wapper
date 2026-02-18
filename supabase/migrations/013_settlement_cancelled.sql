-- Migration 013: Add CANCELLED to settlement_type enum
-- Used when a confirmed cover adjustment is cancelled — distinguishes system
-- cancellations from user-initiated forgiveness (FORGIVEN).

alter type settlement_type add value if not exists 'CANCELLED';

-- ── Cleanup: fix any existing bad rows ──────────────────────────────────────
-- If ledger_entries still have is_settled = false but their linked adjustment
-- has been REMOVED or CANCELLED, mark them as settled so the dashboard and
-- ledger page counts agree.
-- Run this manually after applying the migration if you have stale rows:
--
--   UPDATE ledger_entries
--   SET is_settled = true,
--       settled_at = now(),
--       settlement_type = 'CANCELLED'
--   WHERE is_settled = false
--     AND adjustment_id IN (
--       SELECT id FROM adjustments WHERE status IN ('REMOVED', 'CANCELLED')
--     );
