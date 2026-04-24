# PRD.md — Gaming Time Tracker (PRD from Reality)

> This document describes what the app CURRENTLY DOES, inferred from implemented screens and components.
> It is not a requirements specification for future work.
> [Inference] marks claims not directly provable from code.

---

## Product Overview

**Name:** Gaming Time Tracker (repo: `lol-tracker`)
**Type:** Personal web app — single user at a time, no social/sharing features
**Purpose:** Allow a user to log how much time they spent gaming each day, view statistics, and browse a visual history on a calendar heatmap.
**Game-agnostic:** Despite the repo name suggesting League of Legends, there is no game-specific integration. Any gaming activity can be logged via the optional notes field.

---

## User Type

Single authenticated user per account. Each user only sees their own data.

---

## Feature List (implemented)

### F1 — Authentication

| Feature | Detail | Source |
|---|---|---|
| Email + password signup | User provides email and password (min 6 chars) | `app/signup/page.js` |
| Email + password login | Standard credential check via Supabase | `app/login/page.js` |
| Logout | Single click, session cleared, redirect to login | `app/dashboard/page.js:100-103` |
| Forgot password | Email link sent to user's address | `app/forgot-password/page.js` |
| Password reset | New password set via magic link → `/reset-password` | `app/reset-password/page.js` |
| Auth guard | Unauthenticated users redirected to `/login` automatically | `lib/useAuth.js` |
| [Inference] Email confirmation | Account requires email verification before first login | Per signup success message |

---

### F2 — Session Logging

| Feature | Detail | Source |
|---|---|---|
| Log a session | Form on dashboard: hours (0–24), minutes (0–59), date (default today), notes (optional) | `app/dashboard/page.js:241-300` |
| Backdating | User can set any date for a session, not just today | `app/dashboard/page.js:273-278` |
| Minimum duration | At least 1 minute required (0h 0m rejected with error) | `app/dashboard/page.js:107-109` |
| Maximum duration | 24 hours exactly per session (setting hours to 24 forces minutes to 0) | `app/dashboard/page.js:253-255` |
| Optional notes | Free text field, placeholder "What did you play?" | `app/dashboard/page.js:283-289` |

---

### F3 — Session List (today only)

| Feature | Detail | Source |
|---|---|---|
| View today's sessions | List of all sessions logged for today on the dashboard | `app/dashboard/page.js:302-406` |
| Inline edit | Each session has an "Edit" link that replaces the list item with an inline form | `app/dashboard/page.js:311-374` |
| Edit fields | Same as log form: hours, minutes, date, notes | Same |
| Delete | Each session has a "Delete" link — no confirmation dialog | `app/dashboard/page.js:395-400` |
| No "all sessions" view | Only today's sessions are listed on the dashboard. Older sessions are only visible via the calendar. | `app/dashboard/page.js:303` |

---

### F4 — Statistics Dashboard

Displayed as a 3-column, 2-row grid of stat cards. Only shown when at least one session exists.

| Stat | Calculation | Source |
|---|---|---|
| Today | Sum of all session minutes where `session_date === today` | `computeStats` in `app/dashboard/page.js:28` |
| This Week | Sum of sessions from Monday of the current week onward (ISO week: Mon start) | `computeStats:29` |
| This Month | Sum of sessions from the 1st of the current month onward | `computeStats:30` |
| Streak | Consecutive days backward from today (or yesterday if no session today yet) where a session exists | `computeStats:37-46` |
| Daily Average | Total all-time minutes ÷ number of unique days with sessions | `computeStats:48-49` |
| Longest Session | Single session with the most minutes (not a single day's total) | `computeStats:31` |

**Streak behavior:** If no session has been logged today, the streak counts backward from yesterday (preserving yesterday's streak until end of day). A warning "Play today to keep it!" is shown in orange when the streak does not include today.

---

### F5 — Calendar Heatmap

| Feature | Detail | Source |
|---|---|---|
| Monthly calendar grid | 7-column grid (Mon–Sun), month navigation via Prev/Next buttons | `app/calendar/page.js:113-127` |
| Activity heatmap | Day cells colored by total minutes: 6 intensity levels (none, 1–30m, 31–60m, 1–2h, 2–3h, 3h+) | `app/calendar/page.js:11-17` |
| Today highlight | Current date cell has `ring-2 ring-teal-400 font-bold` | `app/calendar/page.js:157` |
| Clickable cells | Clicking a day cell expands a detail panel below the calendar | `app/calendar/page.js:150-169` |
| Detail panel | Lists all sessions for the selected date (hours, minutes, notes) | `app/calendar/page.js:197-224` |
| Legend | Static color key below the calendar | `app/calendar/page.js:175-195` |
| Read-only | No session creation or editing from the calendar | (absence of forms) |
| Time sub-label | If minutes > 0, formatted time shown inside the day cell | `app/calendar/page.js:162-164` |

---

## Inputs & Outputs

### Session log form

| Input | Type | Constraints |
|---|---|---|
| Hours | Number | 0–24 |
| Minutes | Number | 0–59 (forced to 0 if hours = 24) |
| Date | Date picker | Any date; defaults to today |
| Notes | Textarea | Optional; no length limit enforced in UI |

**Output:** New row in `sessions` Supabase table; stats and today's list refreshed.

### Stats display

**Input:** All session rows from Supabase.
**Output:** 6 computed values displayed as formatted time strings (`Xh Ym`).

### Calendar

**Input:** All session rows from Supabase (aggregated by date client-side).
**Output:** Visual heatmap + session detail on click.

---

## Constraints Visible in UI

| Constraint | Where |
|---|---|
| Min password length: 6 characters | `/signup`, `/reset-password` — HTML `minLength={6}` |
| Session must be ≥ 1 minute | Dashboard log form — JS validation |
| Session max: 24 hours | Dashboard log form — `max="24"` on hours input + minutes clamped |
| No bulk operations | Sessions are individually created, edited, or deleted |
| No game categories or tags | Notes field is plain text only |
| No time-of-day logging | Only date, hours, and minutes duration stored (no start/end time) |
| Today's sessions only on dashboard | Older sessions are only accessible via calendar |
| Calendar is read-only | No session management from the calendar view |
| No social features | No sharing, no public profiles, no multi-user comparisons |
| No data export | No CSV/JSON download available |
| No charts or graphs | Only the heatmap calendar and text stat cards |
