# SWAPPER — Implementation Plan

**Version:** 1.0  
**Date:** February 14, 2026  
**Based on:** SWAPPER PDR V3

---

## Overview

This document outlines the phased implementation plan for SWAPPER, a web-based marketplace for Travel Professionals to coordinate shift Swaps and Covers. The plan is structured for vibe-coding / rapid prototyping while maintaining a clear path to production readiness.

**Target Timeline:** 6-8 weeks to functional demo  
**Team Size Assumption:** 1-2 developers  
**Primary Tech:** Next.js 14 + Supabase + Vercel

---

## Phase 0: Project Setup
**Duration:** 1-2 days

### 0.1 Development Environment
- [ ] Initialize Next.js 14 project with App Router and TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up ESLint + Prettier
- [ ] Initialize Git repository

### 0.2 Supabase Setup
- [ ] Create Supabase project
- [ ] Configure environment variables (local + Vercel)
- [ ] Set up Supabase CLI for migrations
- [ ] Enable Row Level Security (RLS) policies planning

### 0.3 Vercel Setup
- [ ] Connect repository to Vercel
- [ ] Configure environment variables
- [ ] Set up preview deployments for branches
- [ ] Configure custom domain (if available)

### 0.4 Project Structure
```
swapper/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── marketplace/
│   │   ├── calendar/
│   │   ├── directory/
│   │   ├── ledger/
│   │   ├── history/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── (admin)/
│   │   ├── admin/
│   │   └── layout.tsx
│   ├── api/
│   │   └── cron/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # shadcn components
│   ├── calendar/
│   ├── marketplace/
│   ├── listings/
│   ├── ledger/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── actions/            # Server Actions
│   ├── validators/         # Rule enforcement
│   ├── utils/
│   └── types/
├── hooks/
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── public/
```

### Deliverable
- Empty Next.js app deployed to Vercel
- Supabase project connected
- Basic folder structure in place

---

## Phase 1: Database & Authentication
**Duration:** 3-4 days

### 1.1 Database Schema (Supabase Migrations)

#### Migration 001: Users Extension
```sql
-- Extend Supabase auth.users with profile data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  phone text unique,
  name text not null,
  role text not null default 'TP' check (role in ('TP', 'ADMIN')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
```

#### Migration 002: Schedules
```sql
create type day_of_week as enum ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week day_of_week not null,
  shift_start time,
  shift_end time,
  is_day_off boolean not null default false,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  
  constraint valid_shift check (
    (is_day_off = true and shift_start is null and shift_end is null) or
    (is_day_off = false and shift_start is not null and shift_end is not null)
  ),
  unique(user_id, day_of_week, effective_from)
);

alter table public.schedules enable row level security;
```

#### Migration 003: Adjustments
```sql
create type adjustment_type as enum ('SWAP', 'COVER');
create type listing_type as enum ('REQUEST', 'OFFER');
create type adjustment_status as enum (
  'DRAFT', 'OPEN', 'ACCEPTED', 'PENDING_CONFIRMATION', 
  'CONFIRMED', 'EXPIRED', 'REMOVED'
);

create table public.adjustments (
  id uuid primary key default gen_random_uuid(),
  type adjustment_type not null,
  listing_type listing_type not null,
  status adjustment_status not null default 'DRAFT',
  creator_id uuid references public.profiles(id) on delete cascade not null,
  accepter_id uuid references public.profiles(id) on delete set null,
  date date not null,
  original_shift_start time not null,
  original_shift_end time not null,
  desired_shift_start time,
  desired_shift_end time,
  notes text,
  aspect_track_id text,
  accepted_at timestamptz,
  confirmed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.adjustments enable row level security;

-- Index for marketplace queries
create index idx_adjustments_status_date on public.adjustments(status, date);
create index idx_adjustments_creator on public.adjustments(creator_id);
create index idx_adjustments_accepter on public.adjustments(accepter_id);
```

#### Migration 004: Ledger Entries
```sql
create type settlement_type as enum ('COVER_RETURNED', 'CASH', 'FORGIVEN');

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  creditor_id uuid references public.profiles(id) on delete cascade not null,
  debtor_id uuid references public.profiles(id) on delete cascade not null,
  adjustment_id uuid references public.adjustments(id) on delete cascade not null,
  is_settled boolean not null default false,
  settled_at timestamptz,
  settlement_type settlement_type,
  created_at timestamptz not null default now()
);

alter table public.ledger_entries enable row level security;
```

#### Migration 005: Adjustment Logs
```sql
create type log_action as enum (
  'CREATED', 'PUBLISHED', 'ACCEPTED', 'CONFIRMED', 'EXPIRED', 'REMOVED'
);

create table public.adjustment_logs (
  id uuid primary key default gen_random_uuid(),
  adjustment_id uuid references public.adjustments(id) on delete cascade not null,
  action log_action not null,
  actor_id uuid references public.profiles(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.adjustment_logs enable row level security;
```

#### Migration 006: Notifications
```sql
create type notification_type as enum (
  'NEW_MATCH', 'ACCEPTED', 'TIMER_WARNING', 'CONFIRMED', 
  'EXPIRED', 'SHIFT_REMINDER', 'OBLIGATION_CREATED'
);
create type notification_channel as enum ('EMAIL', 'SMS', 'IN_APP');
create type notification_status as enum ('PENDING', 'SENT', 'FAILED');

create table public.notifications (
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

create index idx_notifications_user_status on public.notifications(user_id, status);
```

### 1.2 Authentication Flow
- [ ] Configure Supabase Auth (email/password)
- [ ] Create registration page with phone number capture
- [ ] Create login page
- [ ] Implement auth middleware for protected routes
- [ ] Create profile creation trigger (on auth.users insert)
- [ ] Build password reset flow

### 1.3 Onboarding Flow
- [ ] Schedule confirmation/entry screen post-registration
- [ ] Pre-populate from master list (if user email matches)
- [ ] 7-day schedule entry form (shift times or day off per day)
- [ ] Validation: exactly 2 days off, 5 workdays

### Deliverable
- Users can register, login, logout
- New users complete schedule setup on first login
- Database schema fully deployed
- RLS policies protecting data

---

## Phase 2: Core Schedule & Calendar
**Duration:** 4-5 days

### 2.1 Schedule Management
- [ ] Create schedule data types and Zod schemas
- [ ] Build Server Actions for schedule CRUD
- [ ] Create schedule editing UI in settings
- [ ] Implement "effective_from" for schedule changes

### 2.2 Calendar Components
- [ ] Build weekly strip component (dashboard view)
  - Shows Mon-Sun with shift times
  - Highlights today
  - Shows pending/confirmed adjustments
- [ ] Build monthly calendar component
  - Grid layout with day cells
  - Color-coded status indicators
  - Click to view day details
- [ ] Build day detail modal
  - Shows all adjustments for that day
  - Quick actions (create listing, view details)

### 2.3 Schedule Calculation Logic
```typescript
// lib/utils/schedule.ts
interface EffectiveShift {
  date: Date;
  shiftStart: string | null;
  shiftEnd: string | null;
  isDayOff: boolean;
  adjustments: Adjustment[];
  effectiveShift: {
    start: string;
    end: string;
    type: 'BASE' | 'SWAPPED' | 'COVERING' | 'COVERED';
    relatedUser?: string;
  } | null;
}

function calculateEffectiveSchedule(
  userId: string,
  baseSchedule: Schedule[],
  adjustments: Adjustment[],
  dateRange: { start: Date; end: Date }
): EffectiveShift[];
```

### 2.4 Visual Status Indicators
- [ ] Implement color system per PDR:
  - Gray dashed: DRAFT
  - Yellow/Amber: PENDING_CONFIRMATION
  - Green solid: CONFIRMED
  - Light blue: Day off
  - Purple badge: "Covering [Name]"
  - Teal badge: "Covered by [Name]"

### Deliverable
- Dashboard shows weekly schedule strip
- Calendar page shows monthly view
- Adjustments visually reflected on calendar
- Users can edit their base schedule

---

## Phase 3: Marketplace & Listings
**Duration:** 5-6 days

### 3.1 Listing Creation Flow
- [ ] Create listing form component
  - Type selector: SWAP or COVER
  - Listing type: REQUEST or OFFER
  - Date picker
  - Shift time display (auto-filled from schedule)
  - Desired shift time (for swap requests)
  - Optional notes field
- [ ] Implement DRAFT save functionality
- [ ] Implement publish action (DRAFT → OPEN)
- [ ] Build "My Listings" management view

### 3.2 Server Actions for Listings
```typescript
// lib/actions/listings.ts
'use server'

async function createListing(data: CreateListingInput): Promise<Adjustment>;
async function publishListing(id: string): Promise<Adjustment>;
async function deleteListing(id: string): Promise<void>;
async function acceptListing(id: string): Promise<Adjustment>;
async function confirmListing(id: string, trackId: string): Promise<Adjustment>;
```

### 3.3 Marketplace View
- [ ] Build marketplace page with filters:
  - Type: Swap / Cover / All
  - Listing type: Requests / Offers / All
  - Date range
- [ ] Implement eligibility filtering (show only acceptable listings)
- [ ] Build listing card component:
  - Creator name
  - Date and shift times
  - Type badge
  - "Accept" button (if eligible)
- [ ] Build listing detail modal:
  - Full details
  - Creator info
  - Accept confirmation dialog

### 3.4 Real-time Updates
- [ ] Set up Supabase Realtime subscription for marketplace
- [ ] Auto-refresh listing list when new listings appear
- [ ] Remove accepted listings from view in real-time

### Deliverable
- Users can create, save as draft, publish listings
- Marketplace shows all eligible listings
- Users can accept listings
- Real-time updates when marketplace changes

---

## Phase 4: Rule Enforcement Engine
**Duration:** 4-5 days

### 4.1 Validation Framework
```typescript
// lib/validators/rules.ts

interface ValidationResult {
  valid: boolean;
  violations: RuleViolation[];
}

interface RuleViolation {
  rule: string;
  message: string;
  details?: Record<string, any>;
}

async function validateAcceptance(
  listingId: string,
  accepterId: string
): Promise<ValidationResult>;
```

### 4.2 Individual Rule Validators
- [ ] **8-Hour Rest Rule**
  ```typescript
  async function checkRestBetweenShifts(
    userId: string,
    proposedDate: Date,
    proposedShift: { start: string; end: string }
  ): Promise<RuleViolation | null>;
  ```
  - Check day before: proposed start vs previous end ≥ 8 hours
  - Check day after: proposed end vs next start ≥ 8 hours

- [ ] **Weekly Rest Requirement**
  ```typescript
  async function checkWeeklyRest(
    userId: string,
    proposedDate: Date,
    adjustmentType: 'SWAP' | 'COVER'
  ): Promise<RuleViolation | null>;
  ```
  - Get user's assigned days off for that week
  - Check if accepting would cause working both days off

- [ ] **Cover Given Limit (1/week)**
  ```typescript
  async function checkCoverGivenLimit(
    userId: string,
    proposedDate: Date
  ): Promise<RuleViolation | null>;
  ```
  - Count CONFIRMED + PENDING covers given in same calendar week
  - Block if already at 1

- [ ] **Cover Requested Limit (5/month)**
  ```typescript
  async function checkCoverRequestedLimit(
    userId: string,
    proposedDate: Date
  ): Promise<RuleViolation | null>;
  ```
  - Count CONFIRMED + PENDING cover requests in same calendar month (CST)
  - Block if already at 5

- [ ] **Swap Eligibility**
  ```typescript
  async function checkSwapEligibility(
    creatorId: string,
    accepterId: string,
    date: Date
  ): Promise<RuleViolation | null>;
  ```
  - Both users must be scheduled to work on that date
  - Neither can have it as a day off

### 4.3 Marketplace Filtering
- [ ] Create function to get eligible listings for a user
  ```typescript
  async function getEligibleListings(
    userId: string,
    filters?: ListingFilters
  ): Promise<Adjustment[]>;
  ```
- [ ] Pre-filter listings before display (don't show what can't be accepted)

### 4.4 User-Facing Violation Messages
- [ ] Create clear, actionable error messages for each rule
- [ ] Display in modal when acceptance blocked
- [ ] Example: "You cannot accept this cover because you've already given 1 cover this week (to [Name] on [Date]). The limit is 1 cover given per calendar week."

### Deliverable
- All 5 rules enforced on acceptance
- Marketplace shows only eligible listings
- Clear error messages when rules violated
- Rules consider both CONFIRMED and PENDING_CONFIRMATION adjustments

---

## Phase 5: Confirmation Workflow & Expiration
**Duration:** 3-4 days

### 5.1 Acceptance Flow
- [ ] On accept: set status to PENDING_CONFIRMATION
- [ ] Set `expires_at` to now + 24 hours
- [ ] Create adjustment_log entry
- [ ] Notify both parties (creator + accepter)

### 5.2 Track ID Confirmation UI
- [ ] Build confirmation prompt component
  - Countdown timer display
  - Track ID input field
  - Submit button
- [ ] Show on dashboard for pending confirmations
- [ ] Show in calendar day detail
- [ ] Show in listing detail view

### 5.3 Confirmation Action
```typescript
async function confirmAdjustment(
  adjustmentId: string,
  trackId: string,
  userId: string
): Promise<Adjustment> {
  // Validate user is creator or accepter
  // Validate status is PENDING_CONFIRMATION
  // Validate not expired
  // Update status to CONFIRMED
  // Set confirmed_at
  // Store aspect_track_id
  // Create ledger entry (if COVER type)
  // Log action
  // Notify both parties
}
```

### 5.4 Expiration Cron Job
- [ ] Create Vercel Cron endpoint: `/api/cron/expire-adjustments`
- [ ] Run every 15 minutes
- [ ] Query: `status = 'PENDING_CONFIRMATION' AND expires_at < now()`
- [ ] Update status to EXPIRED
- [ ] Log action
- [ ] Notify both parties
- [ ] Secure endpoint with CRON_SECRET

```typescript
// app/api/cron/expire-adjustments/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  // Find expired adjustments
  // Update each to EXPIRED
  // Send notifications
  // Return summary
}
```

### 5.5 Timer Warning Notification
- [ ] Create cron job for 4-hour warning
- [ ] Query: `status = 'PENDING_CONFIRMATION' AND expires_at BETWEEN now() + 4h AND now() + 4h15m`
- [ ] Send warning to both parties

### Deliverable
- Accepted listings enter 24-hour confirmation window
- Either party can enter Track ID to confirm
- Countdown timer visible to both parties
- Expired adjustments automatically voided
- Warning notification at 4 hours remaining

---

## Phase 6: Ledger & Reciprocity
**Duration:** 2-3 days

### 6.1 Ledger Entry Creation
- [ ] Trigger on COVER adjustment CONFIRMED:
  - creditor = the one who gave the cover (worked the shift)
  - debtor = the one who received the cover (got the day "off")
- [ ] Never create for SWAP type
- [ ] Never create for EXPIRED or REMOVED

### 6.2 Ledger View
- [ ] Build ledger page showing:
  - "People who owe you" section
  - "People you owe" section
  - Settlement status for each
- [ ] Group by person with count
- [ ] Expandable to show individual cover dates

### 6.3 Settlement Actions
- [ ] Mark as settled (dropdown: Cover Returned, Cash, Forgiven)
- [ ] Record settled_at timestamp
- [ ] Optional: link to returned cover adjustment

### 6.4 Ledger Summary on Dashboard
- [ ] Quick stats: "You owe 2 covers" / "3 covers owed to you"
- [ ] Link to full ledger

### Deliverable
- Ledger entries auto-created on confirmed covers
- Users can view who owes them / who they owe
- Users can mark debts as settled
- Dashboard shows ledger summary

---

## Phase 7: Directory & Notifications
**Duration:** 3-4 days

### 7.1 Department Directory
- [ ] Build directory page listing all active TPs
- [ ] Show for each user:
  - Name
  - Base schedule (Mon-Sun shift times or "OFF")
- [ ] Search/filter by name
- [ ] Click to view full schedule detail

### 7.2 Email Notifications (Resend)
- [ ] Set up Resend account and API key
- [ ] Create email templates:
  - Listing accepted
  - Confirmation reminder (4hr warning)
  - Adjustment confirmed
  - Adjustment expired
  - Shift reminder (day before)
- [ ] Build notification sender service
- [ ] Queue notifications in database, process async

### 7.3 SMS Notifications (Twilio)
- [ ] Set up Twilio account
- [ ] Create SMS message templates (shorter versions)
- [ ] Implement SMS sender
- [ ] Respect user preferences (opt-in/out)

### 7.4 Notification Preferences
- [ ] Add to settings page:
  - Email notifications: on/off per type
  - SMS notifications: on/off per type
- [ ] Store preferences in profiles table (jsonb column)

### 7.5 Shift Reminder Cron
- [ ] Daily cron at 6pm: remind users of next-day modified shifts
- [ ] Query: users with CONFIRMED adjustments for tomorrow
- [ ] Send email + SMS (based on preferences)

### Deliverable
- Directory shows all TP schedules
- Email notifications working for key events
- SMS notifications working for key events
- Users can manage notification preferences
- Day-before shift reminders sent automatically

---

## Phase 8: Admin Panel
**Duration:** 2-3 days

### 8.1 Admin Authentication
- [ ] Check role = 'ADMIN' in middleware for /admin routes
- [ ] Redirect non-admins to dashboard

### 8.2 Admin Dashboard
- [ ] Overview stats:
  - Total users (active/inactive)
  - Listings by status
  - Confirmations this week
  - Expirations this week

### 8.3 User Management
- [ ] List all users with search/filter
- [ ] View user detail:
  - Profile info
  - Schedule
  - Adjustment history
  - Ledger balance
- [ ] Actions:
  - Deactivate/reactivate user
  - Reset password trigger
  - Change role (TP ↔ ADMIN)

### 8.4 Adjustment Management
- [ ] List all adjustments with filters:
  - Status
  - Date range
  - User (creator or accepter)
- [ ] View adjustment detail with full log history
- [ ] Admin actions:
  - Force expire (PENDING_CONFIRMATION → EXPIRED)
  - Force confirm (PENDING_CONFIRMATION → CONFIRMED, requires Track ID)
  - Add admin note to log

### 8.5 Activity Logs
- [ ] View adjustment_logs with filters
- [ ] Export capability (CSV)

### Deliverable
- Admins can view all users and adjustments
- Admins can manage user accounts
- Admins can manually expire/confirm adjustments
- Full audit trail visible

---

## Phase 9: Polish & PWA
**Duration:** 3-4 days

### 9.1 Mobile Optimization
- [ ] Audit all pages for mobile responsiveness
- [ ] Implement bottom navigation for mobile
- [ ] Ensure touch targets ≥ 44px
- [ ] Test on real devices (iOS Safari, Android Chrome)

### 9.2 PWA Setup
- [ ] Create manifest.json
- [ ] Create service worker for offline shell
- [ ] Add install prompt
- [ ] Configure app icons (multiple sizes)
- [ ] Test "Add to Home Screen" on iOS and Android

### 9.3 Loading States & Error Handling
- [ ] Add loading skeletons to all data-fetching views
- [ ] Implement error boundaries
- [ ] User-friendly error messages
- [ ] Retry mechanisms for failed actions

### 9.4 UI Polish
- [ ] Consistent spacing and typography
- [ ] Smooth transitions and animations
- [ ] Empty states for lists
- [ ] Success/error toasts for actions
- [ ] Confirmation dialogs for destructive actions

### 9.5 Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Color contrast check
- [ ] Focus indicators

### Deliverable
- App installable as PWA
- Excellent mobile experience
- Polished, professional UI
- Accessible to all users

---

## Phase 10: Testing & Launch Prep
**Duration:** 2-3 days

### 10.1 Manual Testing
- [ ] Create test accounts (multiple TPs + admin)
- [ ] Test complete flows:
  - Registration → schedule setup
  - Create listing → publish → accept → confirm
  - Expiration flow
  - Ledger creation and settlement
  - All notification types
- [ ] Test rule enforcement edge cases
- [ ] Test on multiple devices/browsers

### 10.2 Seed Data
- [ ] Create seed script with:
  - 10-15 test users with varied schedules
  - Sample listings in various states
  - Sample ledger entries
- [ ] Use for demo purposes

### 10.3 Documentation
- [ ] User guide (how to use the app)
- [ ] Admin guide
- [ ] Quick reference card (printable)

### 10.4 Launch Checklist
- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] Error monitoring (Vercel Analytics or Sentry)
- [ ] Custom domain configured
- [ ] SSL verified
- [ ] Rate limiting on sensitive endpoints

### Deliverable
- Thoroughly tested application
- Demo-ready with seed data
- Documentation for users
- Production environment ready

---

## Summary Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Project Setup | 1-2 days | 2 days |
| Phase 1: Database & Auth | 3-4 days | 6 days |
| Phase 2: Schedule & Calendar | 4-5 days | 11 days |
| Phase 3: Marketplace & Listings | 5-6 days | 17 days |
| Phase 4: Rule Enforcement | 4-5 days | 22 days |
| Phase 5: Confirmation & Expiration | 3-4 days | 26 days |
| Phase 6: Ledger | 2-3 days | 29 days |
| Phase 7: Directory & Notifications | 3-4 days | 33 days |
| Phase 8: Admin Panel | 2-3 days | 36 days |
| Phase 9: Polish & PWA | 3-4 days | 40 days |
| Phase 10: Testing & Launch | 2-3 days | 43 days |

**Total: ~6-8 weeks**

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase free tier limits | Monitor usage; upgrade if needed (~$25/mo) |
| Twilio/Resend costs | Start with email-only; SMS opt-in only |
| Complex rule edge cases | Extensive manual testing; admin override capability |
| User adoption | Simple onboarding; mobile-first; peer champions |
| Data accuracy | Users confirm own schedules; admin can correct |

---

## Post-Launch Roadmap (Future Phases)

1. **Analytics Dashboard** — Track marketplace activity, match rates
2. **Listing Expiration** — Auto-expire OPEN listings after X days
3. **Reputation Scores** — Based on confirmation rate
4. **Preferred Partners** — Quick-swap with favorites
5. **Calendar Export** — iCal feed
6. **Dark Mode** — User preference
7. **Native App** — If PWA insufficient

---

*End of Implementation Plan*
