export type UserRole = 'TP' | 'ADMIN'

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export type AdjustmentType = 'SWAP' | 'COVER'

export type ListingType = 'REQUEST' | 'OFFER'

export type AdjustmentStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'ACCEPTED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'REMOVED'

export type SettlementType = 'COVER_RETURNED' | 'CASH' | 'FORGIVEN'

export type LogAction =
  | 'CREATED'
  | 'PUBLISHED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'REMOVED'

export type NotificationType =
  | 'NEW_MATCH'
  | 'ACCEPTED'
  | 'TIMER_WARNING'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'SHIFT_REMINDER'
  | 'OBLIGATION_CREATED'

export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP'

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED'

// ---- Database Row Types ----

export interface Profile {
  id: string
  email: string
  phone: string | null
  name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  user_id: string
  day_of_week: DayOfWeek
  shift_start: string | null // "HH:MM:SS"
  shift_end: string | null   // "HH:MM:SS"
  is_day_off: boolean
  effective_from: string     // "YYYY-MM-DD"
  created_at: string
}

export interface Adjustment {
  id: string
  type: AdjustmentType
  listing_type: ListingType
  status: AdjustmentStatus
  creator_id: string
  accepter_id: string | null
  date: string               // "YYYY-MM-DD"
  original_shift_start: string
  original_shift_end: string
  desired_shift_start: string | null
  desired_shift_end: string | null
  notes: string | null
  aspect_track_id: string | null
  accepted_at: string | null
  confirmed_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  creator?: Profile
  accepter?: Profile
}

export interface LedgerEntry {
  id: string
  creditor_id: string
  debtor_id: string
  adjustment_id: string
  is_settled: boolean
  settled_at: string | null
  settlement_type: SettlementType | null
  reconciled_with_id: string | null
  auto_reconciled: boolean
  created_at: string
  // Joined fields
  creditor?: Profile
  debtor?: Profile
  adjustment?: Adjustment
}

export interface AdjustmentLog {
  id: string
  adjustment_id: string
  action: LogAction
  actor_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  // Joined fields
  actor?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  channel: NotificationChannel
  status: NotificationStatus
  content_summary: string | null
  related_adjustment_id: string | null
  sent_at: string | null
  created_at: string
}

// ---- Form / Action Types ----

export interface CreateListingInput {
  type: AdjustmentType
  listing_type: ListingType
  date: string
  original_shift_start: string
  original_shift_end: string
  desired_shift_start?: string
  desired_shift_end?: string
  notes?: string
}

export interface SetupScheduleInput {
  days: {
    day_of_week: DayOfWeek
    is_day_off: boolean
    shift_start?: string
    shift_end?: string
  }[]
}

// ---- Rule Validation ----

export interface RuleViolation {
  rule: string
  message: string
  details?: Record<string, unknown>
}

export interface ValidationResult {
  valid: boolean
  violations: RuleViolation[]
}

// ---- Calendar Types ----

export type EffectiveShiftType = 'BASE' | 'SWAPPED' | 'COVERING' | 'COVERED'

export interface EffectiveShift {
  date: string
  shiftStart: string | null
  shiftEnd: string | null
  isDayOff: boolean
  adjustments: Adjustment[]
  effectiveShift: {
    start: string | null
    end: string | null
    type: EffectiveShiftType
    relatedUser?: Profile
  } | null
}
