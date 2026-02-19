# S-WAPPER — User Guide

**Version:** 1.0
**Last updated:** February 18, 2026

---

## Table of Contents

1. [What is S-WAPPER?](#1-what-is-s-wapper)
2. [Getting Started: Registration](#2-getting-started-registration)
3. [Setting Up Your Schedule](#3-setting-up-your-schedule)
4. [Understanding the Dashboard](#4-understanding-the-dashboard)
5. [How to Create a Listing](#5-how-to-create-a-listing)
6. [How to Accept a Listing](#6-how-to-accept-a-listing)
7. [How to Confirm with a Trade ID](#7-how-to-confirm-with-a-trade-id)
8. [The Ledger: Tracking Cover Obligations](#8-the-ledger-tracking-cover-obligations)
9. [Legacy / Historical Adjustments](#9-legacy--historical-adjustments)
10. [Calendar and Schedule View](#10-calendar-and-schedule-view)
11. [Notifications and Preferences](#11-notifications-and-preferences)
12. [The Directory](#12-the-directory)
13. [FAQ](#13-faq)

---

## 1. What is S-WAPPER?

S-WAPPER is a coordination tool for AA Travel Professionals (TPs) to find swap and cover partners quickly — faster than Teams or WhatsApp.

**What it does:**
- Lets you post and browse swap/cover listings
- Shows you only listings you can legally accept (rule-enforced)
- Tracks a 24-hour window to enter the Aspect Trade ID after acceptance
- Records cover-for-cover obligations in a ledger
- Sends reminders before modified shifts

**What it does NOT do:**
- S-WAPPER does not create or change your official schedule
- You must still process every adjustment in **Aspect** and enter the Trade ID here to confirm
- This app is independent from AA's official systems

---

## 2. Getting Started: Registration

### Step 1 — Go to the Registration Page

Navigate to `/register` (or click "Create account" on the login page).

### Step 2 — Enter Your Information

> **IMPORTANT: Use your full legal name.**
>
> Enter your name exactly as it appears in Aspect, for example:
> - ✅ "Maria Luisa Santos Reyes"
> - ✅ "Diego Mateo García López"
> - ❌ "Maria Santos" — too short, causes matching issues
>
> Your name appears in all listings and the ledger. Use your full legal name so other TPs can identify you correctly.

Fill in:
- **Full legal name** — as it appears in Aspect
- **Email address** — use one you check regularly for notifications
- **Phone number** (optional) — for SMS notifications
- **Password** — at least 8 characters

### Step 3 — Set Up Your Schedule

After registering, you'll be directed to the Schedule Setup page. Enter your **base weekly schedule** — the shift you're normally assigned for each day of the week.

- **Work days:** Enter your shift start and end times (24-hour or AM/PM)
- **Days off:** Check the "Day off" toggle for your 2 assigned rest days

> You must have **exactly 2 days off** and **5 work days** per week.

Once saved, you'll be taken to the Dashboard.

---

## 3. Setting Up Your Schedule

Your schedule tells S-WAPPER when you're working so it can:
- Auto-fill listing details
- Check eligibility rules before you accept
- Show your calendar correctly

### Edit Your Schedule

Go to **Settings** → **My Schedule**.

For each day of the week:
- **Work day:** Enter `shift start` and `shift end` times
- **Day off:** Toggle "Day off" on

> Shifts that cross midnight (e.g., 10 PM – 6 AM) are supported.
> Enter `22:00` for start and `06:00` for end — S-WAPPER handles overnight logic automatically.

### Effective Date

Schedule changes take effect from the date you set. Your historical adjustments remain unaffected.

---

## 4. Understanding the Dashboard

The Dashboard is your home screen. It shows:

| Section | What it shows |
|---------|---------------|
| **Weekly Strip** | Mon–Sun view of your shifts this week, with any adjustments highlighted |
| **Pending Confirmations** | Accepted adjustments awaiting a Trade ID (with countdown timers) |
| **Ledger Summary** | Quick count of covers you owe / are owed |
| **Quick Actions** | Shortcuts to create a listing or browse the marketplace |

### Status Colors

| Color | Meaning |
|-------|---------|
| Gray (dashed border) | DRAFT — saved but not published |
| Amber / Yellow | PENDING CONFIRMATION — 24-hour countdown active |
| Green | CONFIRMED — Trade ID entered, official |
| Red / Strikethrough | EXPIRED — 24-hour window passed, no changes made |
| Light blue background | Your assigned day off |
| Purple badge | You are covering someone else |
| Teal badge | Someone is covering you |

---

## 5. How to Create a Listing

A **listing** is how you tell other TPs what you need. There are two types of adjustments and two listing styles:

### Adjustment Types

| Type | Meaning |
|------|---------|
| **Swap** | Exchange your shift for someone else's shift on the same date |
| **Cover** | Someone works your shift (or you work theirs) without a direct exchange |

### Listing Styles

| Style | Meaning |
|-------|---------|
| **Request** | You need something (swap or cover) |
| **Offer** | You can provide something (swap or cover) |

### Creating a Listing

1. Go to **My Listings** → **New Listing** (or use the "+" button on the dashboard)
2. Select the adjustment type: **Swap** or **Cover**
3. Select the listing style: **Request** or **Offer**
4. Pick the **date** — your shift details will auto-fill from your schedule
5. For a **Swap Request**, also enter the shift times you're looking for
6. Add optional **notes** (e.g., "Need the afternoon off for a family event")
7. Click **Save as Draft** (won't be visible yet) or **Publish** (visible in marketplace)

### Publishing Later

From **My Listings**, find a draft and click **Publish** when you're ready.

### Removing a Listing

You can delete any OPEN listing from **My Listings** before it's accepted. Once accepted, it moves to PENDING_CONFIRMATION and cannot be removed.

---

## 6. How to Accept a Listing

1. Go to **Marketplace**
2. Browse listings — S-WAPPER only shows listings you are **eligible to accept** based on the business rules
3. Click on a listing to view details
4. Review the shift date, times, and the poster's name
5. Click **Accept** and confirm in the dialog

> Once you accept, the listing immediately moves to **PENDING CONFIRMATION** and both you and the poster have 24 hours to enter the Aspect Trade ID.

### Why Can't I See Certain Listings?

S-WAPPER hides listings that would violate rules if you accepted them. Common reasons:

| Rule | Explanation |
|------|-------------|
| 8-hour rest | Accepting would leave less than 8 hours between your shifts |
| Weekly rest | You'd be working both of your assigned days off in the same week |
| Cover given limit | You've already given 1 cover this calendar week |
| Cover requested limit | You've already received 5 covers this calendar month |
| Swap eligibility | You don't have a regular work shift on that date (you can't swap a day off) |

If a listing is greyed out or missing, one of these rules applies. The error message will explain which.

---

## 7. How to Confirm with a Trade ID

After an adjustment is accepted, both parties have **24 hours** to enter the Aspect Trade ID (also called Track ID). **Either party can enter it** — first one to do it confirms the adjustment.

### Steps

1. Process the adjustment in **Aspect** as you normally would
2. Aspect will generate a **Trade ID** (also called Track ID or TRK number)
3. In S-WAPPER, go to **Dashboard** or **My Listings**
4. Find the adjustment with the amber "PENDING CONFIRMATION" status and countdown timer
5. Click **Enter Trade ID**
6. Type in the Trade ID from Aspect (e.g., `TRK-20260218-1234`)
7. Click **Confirm**

The status will immediately change to **CONFIRMED** (green).

> If neither party confirms within 24 hours, the adjustment **expires automatically**. This means it never happened — your schedule is unchanged and no ledger entry is created.

### What Happens After Confirmation

- **Swap:** Both schedules are updated in the calendar view
- **Cover:** The creditor/debtor relationship is created in the [Ledger](#8-the-ledger-tracking-cover-obligations)
- Both parties receive a confirmation notification

---

## 8. The Ledger: Tracking Cover Obligations

The **Ledger** tracks cover-for-cover obligations between TPs.

### When an Entry is Created

A ledger entry is created **only** when:
- The adjustment type is **Cover** (not Swap)
- The status becomes **CONFIRMED** (not Pending or Expired)

| Term | Who they are |
|------|-------------|
| **Creditor** | The TP who gave the cover (worked the extra shift) |
| **Debtor** | The TP who received the cover (got time off) |

### Viewing the Ledger

Go to **Ledger** to see:
- **People who owe you** — covers you gave that haven't been repaid
- **People you owe** — covers you received that you haven't returned

Each entry shows the date, shift, and status.

### Settling an Obligation

Once a cover obligation has been resolved, mark it as settled:

1. Find the entry in the Ledger
2. Click **Mark as Settled**
3. Choose the settlement method:
   - **Cover Returned** — you worked their shift in return
   - **Cash** — paid cash outside the app
   - **Forgiven** — creditor forgives the obligation

The entry is then marked as settled and moves to the settled section.

---

## 9. Legacy / Historical Adjustments

Use the **Add Past Adjustment** form (found on the History page) to record swaps or covers that happened *before* S-WAPPER was in use.

These go directly to **CONFIRMED** status and will create ledger entries for COVER type.

### When to use it

- You gave or received a cover last month but didn't track it in S-WAPPER
- You want your ledger to reflect real obligations that predate the app

### What to enter

- Type (Swap or Cover)
- Date of the adjustment
- Shift times
- Aspect Trade ID (TRK number)
- The other party (select from the directory, or enter their name if they're not registered yet)
- Your role: **Creditor** (you gave coverage) or **Debtor** (you received coverage)

---

## 10. Calendar and Schedule View

Go to **Calendar** to see a monthly view of your schedule.

### What's shown

- **Base schedule** — your normal daily shift
- **Confirmed adjustments** — overlaid on top of base schedule
- **Pending adjustments** — shown with amber highlight
- **Days off** — shown with a light blue background

### Clicking a Day

Click any day to see:
- Your shift for that day (base or adjusted)
- Any adjustments involving that day
- Quick actions (create listing for that date, view listing details)

---

## 11. Notifications and Preferences

S-WAPPER sends notifications for important events:

| Event | When |
|-------|------|
| Listing Accepted | Someone accepted your listing |
| Confirmation Reminder | 4 hours before your 24-hour window closes |
| Adjustment Confirmed | Trade ID was entered successfully |
| Adjustment Expired | 24-hour window closed without confirmation |
| Shift Reminder | Evening before a modified shift |
| New Obligation | A cover was confirmed and added to the ledger |

### Managing Preferences

Go to **Settings** → **Notifications** to turn each notification type on or off for email and SMS (if your phone number is on file).

---

## 12. The Directory

Go to **Directory** to see all registered TPs and their base schedules.

Use this to:
- Find someone to approach directly about a swap or cover
- See who is available on a given day
- Look up a TP's name for a legacy entry

Click on any TP to see their full weekly schedule.

---

## 13. FAQ

**Q: Do I have to use S-WAPPER to swap shifts?**
A: No. S-WAPPER is a voluntary coordination tool. All swaps and covers still need to be processed in Aspect regardless of whether you used S-WAPPER to find the match.

**Q: What if I accept a listing but then can't go through with it?**
A: You can contact the other party directly. If neither of you enters the Trade ID within 24 hours, the adjustment will expire automatically with no record.

**Q: Can I cancel a confirmed adjustment?**
A: Confirmed adjustments (with a Trade ID) are official. You'd need to reverse the change in Aspect directly. Contact your admin if you need help.

**Q: What's the difference between a Request and an Offer?**
A: A **Request** means you need something (e.g., "I need coverage on Friday"). An **Offer** means you can provide something (e.g., "I'm available to cover a Friday shift"). Both appear in the Marketplace and can be accepted by other TPs.

**Q: Why is my listing not visible to others?**
A: Make sure it's **Published** (not Draft). From My Listings, find the draft and click Publish.

**Q: What happens to my ledger if an adjustment expires?**
A: Expired adjustments do not create ledger entries. The ledger only records confirmed covers.

**Q: Can I update my schedule mid-bid?**
A: Yes. Go to Settings → My Schedule. Changes take effect from the date you set. Existing confirmed adjustments are not affected.

**Q: I registered with a short name by mistake. Can I change it?**
A: Go to **Settings → Profile** to update your name. If your name doesn't appear correctly, ask your admin to update it.

**Q: Who can see my schedule?**
A: All registered TPs can view your base schedule in the Directory. Only you can see your draft listings.

**Q: What does "Trade ID" mean?**
A: Trade ID (also called Track ID or TRK number) is the confirmation number generated by Aspect after you process a swap or cover in the official system. It looks like `TRK-20260218-1234`. You need this to confirm an adjustment in S-WAPPER.

---

*For technical issues or questions, contact your S-WAPPER administrator.*
