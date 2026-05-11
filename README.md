# S-WAPPER

> **Status: Archived — no longer actively deployed.**

A shift-swap marketplace built for Travel Professionals (TPs) at American Airlines to coordinate schedule adjustments faster and more reliably than group chats.

---

## The Problem

AA Travel Professionals need to swap or cover shifts regularly, but coordinating those changes happened informally — through Teams messages, WhatsApp groups, and word of mouth. Finding someone willing to swap on short notice was slow, and tracking who owed whom a cover was done by memory or personal spreadsheets. There was no central place to post a shift, browse available coverage, or keep a record of informal agreements.

S-WAPPER was built to solve exactly that.

---

## What It Does

S-WAPPER is a private web app where TPs can post shifts they need covered or swapped, browse the marketplace for compatible matches, and track the history of adjustments with their team. All official changes still go through AA's Aspect scheduling system — S-WAPPER handles the coordination that happens before that.

### Key Features

- **Marketplace** — Post a shift as a REQUEST or OFFER; teammates browse and accept matches
- **Rule Enforcement** — Automatically blocks invalid swaps/covers based on rest requirements, weekly limits, and eligibility rules (8-hour rest between shifts, max 1 cover given per week, max 5 covers requested per month, etc.)
- **Confirmation Workflow** — Accepted listings enter a 24-hour window for either party to enter the official Aspect Track ID; listings expire automatically if not confirmed
- **Ledger** — Tracks cover debts between teammates (who gave a cover, who received one, and whether it's been returned or settled)
- **Calendar View** — Personal monthly calendar showing scheduled shifts, days off, covers, and swaps at a glance
- **Directory** — Browse all TPs and their weekly schedules
- **Admin Panel** — User management, adjustment oversight, and manual expiration controls
- **Mobile-First UI** — Built for phones, with bottom navigation and touch-friendly targets

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Hosting | Vercel |
| Realtime | Supabase Realtime (live marketplace updates) |

---

## Production Use

S-WAPPER was built independently and used in beta by a real team of Travel Professionals at American Airlines.

**This project is not affiliated with, endorsed by, or sponsored by American Airlines.** It was a personal project built outside of work to address a coordination problem the team faced day-to-day. All official scheduling changes were still processed through AA's internal Aspect system.

---

## Development

S-WAPPER was built with the assistance of [Claude Code](https://claude.ai/code), Anthropic's AI coding tool. Development was a collaborative process — not fully manual, not fully AI-generated — guided by a structured implementation plan. The architecture, business logic, and product decisions were authored and directed by the developer throughout.

---

## Project Status

**Archived — v1.0-final.** The app is no longer actively deployed or maintained. The source code is public for portfolio and reference purposes.

Post-beta feedback, planned improvements, internal beta test results, and any changes scoped after the first beta cycle are not included in this repository and remain private.

---

## License

MIT © 2026 Manfred Josue Manriquez Vega — see [LICENSE](LICENSE).
