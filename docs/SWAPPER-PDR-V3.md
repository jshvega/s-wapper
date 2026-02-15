# SWAPPER - TP Swap & Cover Marketplace
## Product Design Requirements (PDR)

**Version:** 3.0  
**Date:** February 14, 2026  
**Status:** Finalized

---

## 1. Product Overview

A web-based marketplace and scheduling assistant designed for Travel Professionals (TPs) to discover, coordinate, and track shift Swaps and Covers with other TPs.

The application is **independent from American Airlines' official scheduling systems** and does not create or enforce official schedule adjustments. Instead, it functions as a discovery and coordination layer to help TPs find matching Swap or Cover agreements faster than current manual methods (Teams messages, WhatsApp groups, in-office requests).

All official schedule changes must still be processed in **Aspect** (AA's official system).

---

## 2. Core Problem

If a TP needs a schedule adjustment (e.g., needs a 6am–3pm shift on Thursday instead of 11am–8pm), their only options are:
- Asking coworkers individually
- Posting in Teams channels
- Posting in WhatsApp groups

This is inefficient due to:
- Low visibility of requests
- Message overload in group chats
- Time sensitivity of adjustments (requests get buried)
- No structured tracking of agreements
- No reminder system for modified schedules
- No centralized record of cover-for-cover obligations

Aspect records finalized adjustments and generates Track IDs but **does not provide a matching mechanism** to find someone willing to Swap or Cover.

---

## 3. Product Purpose

The application serves as:

| Feature | Description |
|---------|-------------|
| **Marketplace** | Publish and accept Swap or Cover requests/offers |
| **Personal Schedule Tracker** | Visualize expected schedules after proposed adjustments |
| **Confirmation Workflow** | 24-hour window to add Aspect Track ID; unconfirmed adjustments auto-expire |
| **Reminder System** | Notifications for modified upcoming shifts |
| **Department Directory** | View assigned shifts and days off for all participating TPs |
| **Reciprocity Ledger** | Track cover-for-cover obligations with optional settlement marking |
| **Admin Dashboard** | Oversight view for administrators to monitor activity and resolve issues |

---

## 4. User Roles

### 4.1 Travel Professional (TP)
- Register and manage account
- Confirm/update personal base schedule
- Create, publish, and manage adjustment listings
- Accept others' requests/offers
- View personal calendar with adjustments
- Receive notifications (email + SMS)
- Track reciprocity ledger (owes/owed)

### 4.2 Administrator
- View all users and their schedules
- View all adjustments (all statuses)
- Manually expire or confirm adjustments
- Resolve disputes
- Access activity logs
- Manage user accounts (deactivate, reset, etc.)

---

## 5. Adjustment Authority Model

Adjustments coordinated through this platform are considered:

> **Proposed Adjustments**

An adjustment becomes **Official** only after it is submitted and accepted within Aspect, which generates a unique:

> **Track ID**

### 5.1 Track ID Confirmation Requirement

Every Swap or Cover coordinated through the web application must be confirmed by:
- Entering the corresponding Aspect Track ID
- Within a **24-hour** confirmation window

Either TP involved in the adjustment may enter the Track ID.

### 5.2 Confirmation Flow

1. TP creates adjustment listing (status: DRAFT)
2. TP publishes listing (status: OPEN)
3. Another TP accepts listing (status: ACCEPTED)
4. Confirmation timer begins — 24 hours (status: PENDING_CONFIRMATION)
5. TPs submit adjustment in Aspect → Aspect generates Track ID
6. Either TP enters Track ID in webapp
7. Adjustment becomes CONFIRMED (Official)

### 5.3 Expiration Rule

If no Track ID is entered within the 24-hour confirmation window:
- The adjustment automatically expires (status: EXPIRED)
- It is removed from both users' calendars
- No ledger entries are created
- The adjustment is considered void

This prevents accumulation of adjustments that were never officially processed in Aspect.

---

## 6. Adjustment Status State Machine

```
                                    ┌─────────┐
                                    │ REMOVED │
                                    └─────────┘
                                         ▲
                                         │ delete
                                         │
┌───────┐  publish   ┌──────┐  accept   ┌──────────┐  (timer starts)  ┌─────────────────────┐
│ DRAFT │ ─────────▶ │ OPEN │ ────────▶ │ ACCEPTED │ ───────────────▶ │ PENDING_CONFIRMATION│
└───────┘            └──────┘           └──────────┘                  └─────────────────────┘
    │                    │                                                   │           │
    │ delete             │ delete                                            │           │
    ▼                    ▼                                                   │           │
┌─────────┐         ┌─────────┐                              Track ID added  │           │ 24hr expires
│ REMOVED │         │ REMOVED │                                              │           │
└─────────┘         └─────────┘                                              ▼           ▼
                                                                      ┌───────────┐  ┌─────────┐
                                                                      │ CONFIRMED │  │ EXPIRED │
                                                                      └───────────┘  └─────────┘
```

### 6.1 Status Definitions

| Status | Description |
|--------|-------------|
| **DRAFT** | Created but not published; editable/deletable; no marketplace visibility |
| **OPEN** | Published and visible in marketplace; awaiting someone to accept |
| **ACCEPTED** | Mutual agreement reached; removed from marketplace; confirmation timer begins |
| **PENDING_CONFIRMATION** | Shown in both users' calendars as pending; countdown timer displayed; either TP may enter Track ID |
| **CONFIRMED** | Aspect Track ID entered in time; considered Official; shown as confirmed in calendars |
| **EXPIRED** | No Track ID entered within 24 hours; removed from calendars; void |
| **REMOVED** | Deleted by creator before acceptance; no calendar or ledger impact |

### 6.2 State Transitions

| From | To | Trigger |
|------|----|---------|
| DRAFT | OPEN | Creator publishes listing |
| DRAFT | REMOVED | Creator deletes listing |
| OPEN | ACCEPTED | Another TP accepts the listing |
| OPEN | REMOVED | Creator deletes listing |
| ACCEPTED | PENDING_CONFIRMATION | Immediate (auto-transition, timer starts) |
| PENDING_CONFIRMATION | CONFIRMED | Either party adds valid Aspect Track ID |
| PENDING_CONFIRMATION | EXPIRED | 24 hours elapse without Track ID |

---

## 7. Rule Enforcement

The system **must validate and block** acceptance of any adjustment that would violate these rules:

### 7.1 Rest Between Shifts
- Minimum **8 hours** between the end of one worked shift and the start of the next
- Applies across regular shifts, swaps, and covers

### 7.2 Weekly Rest Requirement
- Each TP has 2 assigned days off per week
- TP **must take at least 1** of those days off as actual rest
- Cannot work both assigned days off in the same calendar week

### 7.3 Cover Limitations
- A TP may **give** a cover no more than **1 time per calendar week**
- A TP may **request** to be covered up to **5 times per calendar month** (CST)

### 7.4 Swap Rules
- Swaps can only occur on days when **both TPs are originally scheduled to work**
- Swaps exchange shift times only (no role/position considerations)
- No limit on number of swaps

### 7.5 Enforcement Behavior
- When a TP attempts to accept a listing, system validates all rules
- If any rule would be violated → **block acceptance** with clear explanation
- Validation considers all existing CONFIRMED + PENDING_CONFIRMATION adjustments
- Marketplace shows only listings the viewing TP is eligible to accept

---

## 8. Ledger Interaction Rule

**Critical:** Obligation (cover-for-cover) ledger entries are generated **only** when:

> Adjustment Status = **CONFIRMED**

EXPIRED or REMOVED adjustments must **never** generate:
- Cover credits
- Cover debts
- Cash settlement entries

---

## 9. Main Application Sections

### A. Marketplace (Department Listings)

Displays (filtered to eligible matches only):
- Active Swap requests
- Active Cover requests
- Offers to Swap
- Offers to Cover

Users may:
- View listing details
- Accept listing
- Ignore listing

Accepted listings transition through: ACCEPTED → PENDING_CONFIRMATION

### B. Personal Calendar

Displays:
- Assigned default shifts
- Days off
- DRAFT adjustments (creator only)
- PENDING_CONFIRMATION adjustments
- CONFIRMED adjustments
- Visual distinction for: covering someone else vs being covered

Calendar reflects **expected working schedule** (not necessarily official until CONFIRMED).

### C. Side Menu Sections

1. **Dashboard** — Weekly overview + pending notifications + quick actions
2. **Profile/Settings** — Account management, notification preferences, schedule editing
3. **Department Directory** — All TPs with assigned shifts and days off
4. **Reciprocity Ledger** — Covers owed to others, covers owed to user, settlement status
5. **Adjustment History** — Past adjustments (all statuses)
6. **Admin Panel** (admin only) — User management, all adjustments, logs

---

## 10. Notifications

### 10.1 Notification Channels
- **Email** (via Resend)
- **SMS** (via Twilio)
- **In-App** (badge/toast)

### 10.2 Notification Matrix

| Event | Email | SMS | In-App |
|-------|-------|-----|--------|
| New eligible listing matches your schedule | ✓ | ✓ | ✓ |
| Someone accepted your listing | ✓ | ✓ | ✓ |
| Confirmation timer warning (4 hrs remaining) | ✓ | ✓ | ✓ |
| Adjustment confirmed (Track ID added) | ✓ | ○ | ✓ |
| Adjustment expired (timer ran out) | ✓ | ✓ | ✓ |
| Shift reminder (day before modified shift) | ✓ | ✓ | ✓ |
| New cover obligation created | ✓ | ○ | ✓ |

✓ = Enabled by default  
○ = Optional (user preference)

---

## 11. Data Model

### 11.1 Users
```
users
├── id (UUID, PK)
├── email (unique)
├── phone (unique)
├── password_hash
├── name
├── role (enum: TP, ADMIN)
├── is_active (boolean)
├── created_at
└── updated_at
```

### 11.2 Base Schedules
```
schedules
├── id (UUID, PK)
├── user_id (FK → users)
├── day_of_week (enum: MON, TUE, WED, THU, FRI, SAT, SUN)
├── shift_start (time, nullable if day off)
├── shift_end (time, nullable if day off)
├── is_day_off (boolean)
├── effective_from (date)
└── created_at
```

### 11.3 Adjustments
```
adjustments
├── id (UUID, PK)
├── type (enum: SWAP, COVER)
├── listing_type (enum: REQUEST, OFFER)
├── status (enum: DRAFT, OPEN, ACCEPTED, PENDING_CONFIRMATION, CONFIRMED, EXPIRED, REMOVED)
├── creator_id (FK → users)
├── accepter_id (FK → users, nullable)
├── date (date)
├── original_shift_start (time)
├── original_shift_end (time)
├── desired_shift_start (time, nullable — for swap requests)
├── desired_shift_end (time, nullable — for swap requests)
├── notes (text, nullable — optional message from creator)
├── aspect_track_id (string, nullable)
├── accepted_at (timestamp, nullable)
├── confirmed_at (timestamp, nullable)
├── expires_at (timestamp, nullable — set when status becomes PENDING_CONFIRMATION)
├── created_at
└── updated_at
```

### 11.4 Ledger Entries
```
ledger_entries
├── id (UUID, PK)
├── creditor_id (FK → users — the one who gave the cover)
├── debtor_id (FK → users — the one who received the cover)
├── adjustment_id (FK → adjustments)
├── is_settled (boolean, default false)
├── settled_at (timestamp, nullable)
├── settlement_type (enum: COVER_RETURNED, CASH, FORGIVEN, nullable)
└── created_at
```

### 11.5 Adjustment Logs (Lightweight Lineage Tracking)
```
adjustment_logs
├── id (UUID, PK)
├── adjustment_id (FK → adjustments)
├── action (enum: CREATED, PUBLISHED, ACCEPTED, CONFIRMED, EXPIRED, REMOVED)
├── actor_id (FK → users)
├── metadata (JSONB — for chained swap lineage, notes, etc.)
└── created_at
```

### 11.6 Notifications Log
```
notifications
├── id (UUID, PK)
├── user_id (FK → users)
├── type (enum: NEW_MATCH, ACCEPTED, TIMER_WARNING, CONFIRMED, EXPIRED, SHIFT_REMINDER, OBLIGATION_CREATED)
├── channel (enum: EMAIL, SMS, IN_APP)
├── status (enum: PENDING, SENT, FAILED)
├── content_summary (text)
├── sent_at (timestamp, nullable)
└── created_at
```

---

## 12. Tech Stack

### 12.1 Core Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend + Backend** | Next.js 14 (App Router, TypeScript) | Modern full-stack framework, Server Actions for business logic |
| **UI Components** | Tailwind CSS + shadcn/ui | Rapid styling, consistent design system, accessible components |
| **Database** | Supabase (PostgreSQL) | Relational queries, built-in auth, real-time subscriptions, generous free tier |
| **Authentication** | Supabase Auth | Email/password out of the box, easy to add 2FA later |
| **Email Notifications** | Resend | Developer-friendly API, reliable delivery |
| **SMS Notifications** | Twilio | Industry standard, straightforward integration |
| **Hosting** | Vercel | Zero-config Next.js deployment, free tier sufficient for 50-100 users |
| **Scheduled Jobs** | Vercel Cron or Supabase Edge Functions | Timer expiration checks, reminder sends |
| **Real-time Updates** | Supabase Realtime | Live marketplace updates without polling |

### 12.2 Mobile Strategy

- **PWA (Progressive Web App)** support for installable mobile experience
- Mobile-first responsive design
- Touch-friendly tap targets (minimum 44px)
- Bottom navigation for primary actions on mobile

---

## 13. Architecture Strategy

### Start With
> **Next.js + Supabase Monolith**

### Avoid Until After Demo Validation
- Microservices
- Native mobile app (iOS/Android)
- Separate API layer
- Complex caching infrastructure

This keeps the codebase simple, deployable, and suitable for rapid iteration during the demo/vibe-coding phase.

---

## 14. UI/UX Requirements

### 14.1 Key Views

| View | Description |
|------|-------------|
| **Dashboard** | Weekly schedule strip + pending notifications + quick actions |
| **Marketplace** | Filterable list of eligible requests/offers |
| **My Calendar** | Monthly view of personal schedule with adjustments |
| **Create Listing** | Form to create DRAFT adjustment |
| **Listing Detail** | Full details + Accept/Ignore actions |
| **Directory** | List of all TPs with their base schedules |
| **Ledger** | Reciprocity tracker (who owes whom) |
| **History** | Past adjustments with status |
| **Profile/Settings** | Account management, notification preferences, schedule editing |
| **Admin Panel** | User management, all adjustments view, logs |

### 14.2 Visual Status Indicators

| Status | Calendar Display | Color Suggestion |
|--------|-----------------|------------------|
| DRAFT | Shown only to creator, dashed border | Gray |
| OPEN | Not on calendar (in marketplace only) | — |
| PENDING_CONFIRMATION | Both users see it, with countdown timer | Yellow/Amber |
| CONFIRMED | Solid display, checkmark badge | Green |
| EXPIRED | Shown in history only, strikethrough | Red |
| Day Off | Distinct background | Light blue |
| Covering Someone | Badge: "Covering [Name]" | Purple |
| Being Covered | Badge: "Covered by [Name]" | Teal |

---

## 15. Out of Scope for V1

- Integration with Aspect (beyond manual Track ID entry)
- Partial shift covers (full shifts only)
- Payment processing for cash settlements
- Two-factor authentication
- Native push notifications (PWA covers basic)
- Advanced analytics/reporting
- Automatic schedule import from Aspect
- Role-based marketplace visibility (all TPs equal)
- Recurring adjustment templates
- Calendar export (iCal)

---

## 16. Success Metrics

| Metric | Target |
|--------|--------|
| User adoption | 70%+ of TPs registered within 60 days |
| Marketplace activity | 20+ listings per week |
| Confirmation rate | 80%+ of accepted adjustments confirmed with Track ID |
| Time to match | Average < 4 hours from listing to acceptance |
| User satisfaction | 4+ stars on feedback surveys |

---

## 17. Open Items / Future Considerations

- Listing expiration for OPEN status (auto-expire if no one accepts within X days?)
- Reputation/reliability scores based on confirmation rates
- Preferred partners / blocking
- Recurring adjustment templates
- Calendar export (iCal)
- Dark mode
- Push notifications via native app

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **TP** | Travel Professional — the end user of this application |
| **Swap** | Exchange of shift times between two TPs on a day when both are scheduled to work |
| **Cover** | One TP works a shift on behalf of another TP |
| **Aspect** | AA's official system for recording finalized schedule adjustments |
| **Track ID** | Unique identifier generated by Aspect when an adjustment is officially recorded |
| **RTO** | Real Time Operations — AA department overseeing schedule adjustments |
| **Ledger** | Record of cover-for-cover obligations between TPs |
| **Listing** | A published adjustment request or offer in the marketplace |

---

## Appendix B: Schedule Adjustment Rules Reference

*(Extracted from official AA documentation)*

### Swaps
- Exchange of shift times only (not role/position dependent)
- Both TPs must be scheduled to work on the swap day
- No limit on number of swaps
- May be chained (swap an already-swapped shift)

### Covers
- One TP works on behalf of another
- Full shift only (v1 limitation)
- Max 1 cover **given** per calendar week
- Max 5 covers **requested** per calendar month (CST)

### Rest Requirements
- Minimum 8 hours between end of one shift and start of next
- Must take at least 1 of 2 assigned days off each week

---

*End of Document*
