# CLAUDE.md — SWAPPER

## Project Overview

SWAPPER is a web-based marketplace for Travel Professionals (TPs) at American Airlines to coordinate shift Swaps and Covers. It is independent from AA's official systems — all official adjustments must still be processed in Aspect (AA's system), which generates Track IDs.

**Core Purpose:** Help TPs find swap/cover partners faster than Teams/WhatsApp. Think of it as a "marketplace + calendar + reminder system" for shift adjustments.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password)
- **Hosting:** Vercel (for production) / localhost for demo
- **Notifications:** Resend (email) + Twilio (SMS) — SKIP FOR DEMO, use console.log

---

## Project Structure

```
swapper/
├── app/
│   ├── (auth)/                    # Auth routes (no sidebar)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── onboarding/page.tsx    # Schedule setup for new users
│   │   └── layout.tsx
│   ├── (dashboard)/               # Main app routes (with sidebar)
│   │   ├── dashboard/page.tsx     # Weekly strip + quick actions
│   │   ├── marketplace/page.tsx   # Browse/accept listings
│   │   ├── calendar/page.tsx      # Monthly calendar view
│   │   ├── listings/
│   │   │   ├── page.tsx           # My listings
│   │   │   ├── new/page.tsx       # Create listing
│   │   │   └── [id]/page.tsx      # Listing detail
│   │   ├── directory/page.tsx     # All TPs and schedules
│   │   ├── ledger/page.tsx        # Who owes whom
│   │   ├── history/page.tsx       # Past adjustments
│   │   ├── settings/page.tsx      # Profile + schedule editing
│   │   └── layout.tsx             # Sidebar + mobile nav
│   ├── (admin)/                   # Admin routes
│   │   ├── admin/page.tsx
│   │   ├── admin/users/page.tsx
│   │   ├── admin/adjustments/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Redirect to /dashboard or /login
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── calendar/
│   │   ├── weekly-strip.tsx
│   │   ├── monthly-calendar.tsx
│   │   └── day-cell.tsx
│   ├── marketplace/
│   │   ├── listing-card.tsx
│   │   ├── listing-filters.tsx
│   │   └── accept-dialog.tsx
│   ├── listings/
│   │   ├── listing-form.tsx
│   │   ├── confirmation-timer.tsx
│   │   └── track-id-input.tsx
│   ├── ledger/
│   │   ├── ledger-list.tsx
│   │   └── settle-dialog.tsx
│   └── shared/
│       ├── sidebar.tsx
│       ├── mobile-nav.tsx
│       ├── user-avatar.tsx
│       └── status-badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   └── middleware.ts          # Auth middleware
│   ├── actions/                   # Server Actions
│   │   ├── auth.ts
│   │   ├── schedules.ts
│   │   ├── listings.ts
│   │   ├── ledger.ts
│   │   └── admin.ts
│   ├── validators/
│   │   └── rules.ts               # Rule enforcement logic
│   ├── utils/
│   │   ├── schedule.ts            # Schedule calculation helpers
│   │   ├── dates.ts               # Date/time helpers
│   │   └── constants.ts
│   └── types/
│       └── index.ts               # TypeScript types
├── hooks/
│   ├── use-user.ts
│   ├── use-schedule.ts
│   └── use-realtime.ts
├── supabase/
│   ├── migrations/                # SQL migration files
│   └── seed.sql                   # Demo data
└── public/
```

---

## Key Data Types

```typescript
// Adjustment Status State Machine
type AdjustmentStatus = 
  | 'DRAFT'                 // Created, not published
  | 'OPEN'                  // In marketplace, awaiting acceptance
  | 'ACCEPTED'              // Someone accepted (instant transition to next)
  | 'PENDING_CONFIRMATION'  // 24hr window to add Track ID
  | 'CONFIRMED'             // Track ID added, official
  | 'EXPIRED'               // 24hr window passed, void
  | 'REMOVED';              // Deleted before acceptance

type AdjustmentType = 'SWAP' | 'COVER';
type ListingType = 'REQUEST' | 'OFFER';

type SettlementType = 'COVER_RETURNED' | 'CASH' | 'FORGIVEN';

type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

type UserRole = 'TP' | 'ADMIN';
```

---

## Business Rules (MUST ENFORCE)

### 1. Rest Between Shifts
- Minimum **8 hours** between end of one shift and start of next
- Check both day before AND day after the proposed adjustment

### 2. Weekly Rest Requirement
- Each TP has 2 assigned days off per week
- Must take **at least 1** of those as actual rest
- Cannot work BOTH assigned days off in same calendar week

### 3. Cover Given Limit
- Max **1 cover given** per calendar week
- Count CONFIRMED + PENDING_CONFIRMATION adjustments

### 4. Cover Requested Limit
- Max **5 covers requested** per calendar month (CST timezone)
- Count CONFIRMED + PENDING_CONFIRMATION adjustments

### 5. Swap Eligibility
- Both TPs must be scheduled to work on the swap date
- Neither can have that day as an assigned day off

### Enforcement Points
- **Block acceptance** if any rule would be violated
- **Filter marketplace** to only show listings user can accept
- Show clear error message explaining which rule and why

---

## State Transitions

```
DRAFT → OPEN (publish)
DRAFT → REMOVED (delete)
OPEN → ACCEPTED (someone accepts) → immediately → PENDING_CONFIRMATION (timer starts)
OPEN → REMOVED (creator deletes)
PENDING_CONFIRMATION → CONFIRMED (Track ID entered)
PENDING_CONFIRMATION → EXPIRED (24 hours pass)
```

---

## Confirmation Workflow

1. When listing is ACCEPTED:
   - Set `status` to `PENDING_CONFIRMATION`
   - Set `expires_at` to `now() + 24 hours`
   - Set `accepted_at` to `now()`
   - Set `accepter_id` to accepting user

2. Either party can enter Track ID:
   - Validate status is `PENDING_CONFIRMATION`
   - Validate `expires_at` > now()
   - Set `aspect_track_id`
   - Set `confirmed_at` to now()
   - Set `status` to `CONFIRMED`
   - If type is COVER: create ledger entry

3. On expiration (24hr passes):
   - Set `status` to `EXPIRED`
   - Do NOT create ledger entry

---

## Ledger Rules

- Ledger entries created **ONLY** for COVER type adjustments
- Ledger entries created **ONLY** when status becomes CONFIRMED
- `creditor` = the one who GAVE the cover (worked the shift)
- `debtor` = the one who RECEIVED the cover (got time off)
- NEVER create ledger entries for SWAP, EXPIRED, or REMOVED

---

## UI/UX Guidelines

### Mobile-First
- Assume most users on phones
- Touch targets minimum 44px
- Bottom navigation on mobile
- Sidebar on desktop

### Status Colors
| Status | Color | Display |
|--------|-------|---------|
| DRAFT | Gray | Dashed border |
| PENDING_CONFIRMATION | Amber/Yellow | With countdown timer |
| CONFIRMED | Green | Solid with checkmark |
| EXPIRED | Red | Strikethrough (history only) |
| Day Off | Light Blue | Background |
| Covering Someone | Purple | Badge: "Covering [Name]" |
| Being Covered | Teal | Badge: "Covered by [Name]" |

### Components to Use (shadcn/ui)
- Button, Card, Dialog, DropdownMenu
- Input, Label, Select, Textarea
- Badge, Avatar, Separator
- Calendar (for date picker)
- Toast (for notifications)
- Skeleton (for loading states)

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# For production (not needed for demo)
RESEND_API_KEY=re_xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
```

---

## Demo Mode Shortcuts

For the demo/vibe-coding phase:

1. **Skip external notifications** — Use console.log or toast instead
2. **Skip cron jobs** — Add manual "Expire Now" button in admin
3. **Skip SMS entirely** — Email-only or in-app only
4. **Use seed data** — Create 5-10 test users with varied schedules
5. **Hardcode admin** — First registered user or specific email = admin

---

## File Naming Conventions

- Components: `kebab-case.tsx` (e.g., `listing-card.tsx`)
- Pages: `page.tsx` in route folder
- Server Actions: `camelCase` functions in `/lib/actions/`
- Types: PascalCase (e.g., `Adjustment`, `LedgerEntry`)

---

## Common Patterns

### Server Action Pattern
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  // ... logic
  
  revalidatePath('/marketplace')
  return { success: true }
}
```

### Protected Route Pattern
```typescript
// In page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  // ... rest of page
}
```

### Realtime Subscription Pattern
```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMarketplaceRealtime(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('marketplace')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'adjustments',
        filter: 'status=eq.OPEN'
      }, onUpdate)
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [onUpdate])
}
```

---

## Quick Reference: What Each Page Does

| Page | Purpose |
|------|---------|
| `/login` | Email/password login |
| `/register` | Create account |
| `/onboarding` | Set up 7-day schedule (new users) |
| `/dashboard` | Weekly strip, pending items, quick actions |
| `/marketplace` | Browse and accept others' listings |
| `/calendar` | Monthly view of personal schedule |
| `/listings` | Manage my own listings |
| `/listings/new` | Create new listing form |
| `/directory` | See all TPs and their schedules |
| `/ledger` | Who owes whom covers |
| `/history` | Past adjustments |
| `/settings` | Edit profile, schedule, preferences |
| `/admin` | Admin dashboard (if role = ADMIN) |

---

## Remember

- This is a **coordination tool**, not the official system
- All adjustments are "proposed" until confirmed with Track ID in Aspect
- Expired = never happened (no calendar impact, no ledger)
- Mobile-first, always
- Rule enforcement protects everyone — never skip validation

---

*Last updated: February 14, 2026*
