# APP_FLOW.md — Gaming Time Tracker

> Routes and user journeys reconstructed from filesystem and source code.

---

## Route Map

| Route | File | Auth Required | Server/Client |
|---|---|---|---|
| `/` | `app/page.js` | No | Server Component |
| `/login` | `app/login/page.js` | No | Client Component |
| `/signup` | `app/signup/page.js` | No | Client Component |
| `/forgot-password` | `app/forgot-password/page.js` | No | Client Component |
| `/reset-password` | `app/reset-password/page.js` | No (link-based) | Client Component |
| `/dashboard` | `app/dashboard/page.js` | Yes | Client Component |
| `/calendar` | `app/calendar/page.js` | Yes | Client Component |
| *(any unknown)* | `app/not-found.js` | No | Server Component |
| *(runtime error)* | `app/error.js` | No | Client Component |

---

## Navigation Structure

There is no persistent global navigation bar or sidebar. Navigation is contextual:

**Unauthenticated screens:** Link pairs embedded in the page content (e.g., "Don't have an account? Sign up" on login).

**Authenticated screens (dashboard):** A header row containing:
- App title (non-clickable)
- User email (display only)
- "Calendar" link → `/calendar`
- "Log out" button

**Authenticated screens (calendar):** A header row containing:
- App title (non-clickable)
- "Dashboard" link → `/dashboard`

There are no breadcrumbs, no sidebar, no bottom navigation, and no back-navigation affordance from the browser's perspective (Next.js `<Link>` handles client-side navigation).

---

## User Journeys

### Journey 1 — New user sign-up

```
/ (landing)
  └─[Sign up button]─► /signup
       └─[Submit form]─► Success message: "Account created! Check your email..."
            (no redirect — user stays on /signup and must navigate to /login manually)
       └─[Log in link]─► /login
```

**Primary action:** Fill email + password, submit.
**Constraint:** Password minimum 6 characters (HTML5 `minLength`). Email format enforced by `type="email"`.
**Post-submit state:** Success message shown; form stays visible; no auto-redirect.
**Email confirmation:** [Inference] Required before login works (per the success message text).

---

### Journey 2 — Returning user login

```
/ (landing)
  └─[Log in button]─► /login
       └─[Submit form → success]─► /dashboard
       └─[Submit form → error]─► Inline error message, stays on /login
       └─[Forgot password?]─► /forgot-password
       └─[Sign up link]─► /signup
```

**Primary action:** Enter email + password, submit.
**Loading state:** Button text changes to "Logging in…" and is disabled during request.
**Error state:** `<p className="text-red-400 text-sm">` shown above submit button.

---

### Journey 3 — Password reset

```
/login
  └─[Forgot password?]─► /forgot-password
       └─[Submit email → success]─► "Check your email..." message shown
       └─[Submit email → error]─► Error message shown
       └─[Email link clicked by user]─► /reset-password
            └─[PAGE LOAD — waiting for PASSWORD_RECOVERY event]
                 └─[Token valid within 5s]─► New password form shown
                 └─[Token invalid / 5s timeout]─► "Reset link is invalid or expired"
                                                       └─[Request a new one link]─► /forgot-password
            └─[Submit new password → success]─► /dashboard
            └─[Submit new password → error]─► Inline error message
```

**5-second timeout:** `app/reset-password/page.js:17` — if `PASSWORD_RECOVERY` event not received within 5 seconds, `expired` state triggers the error message.

---

### Journey 4 — Log a gaming session (happy path)

```
/dashboard (authenticated)
  └─[Fill "Log a Session" form]
       Fields: Hours (0–24), Minutes (0–59), Date (date picker, default today), Notes (optional)
       └─[Submit]─► Supabase insert ─► fetchSessions() ─► page refreshes with new data
       └─[Submit with 0h 0m]─► Inline error: "Please enter at least 1 minute."
       └─[Supabase error]─► Inline error message shown
```

**Primary action:** `handleSubmit` at `app/dashboard/page.js:105`.
**Loading state:** Button text changes to "Saving…" and is disabled.
**Constraint:** `hours === 24` forces `minutes` to 0 (exactly 24h max).

---

### Journey 5 — Edit a session

```
/dashboard
  Session list item (today's sessions only)
  └─[Edit button]─► Inline form replaces the list item display
       Fields: Hours, Minutes, Date, Notes (pre-populated)
       └─[Save]─► Supabase update ─► fetchSessions() ─► list re-renders
       └─[Save with 0h 0m]─► Inline error: "Please enter at least 1 minute."
       └─[Cancel]─► Inline form collapses, original display returns
```

**Important:** Only **today's sessions** are shown in the session list on the dashboard. Sessions from other dates are not editable from the dashboard (they are visible in the calendar but read-only there). There is no "all sessions" view.

---

### Journey 6 — Delete a session

```
/dashboard
  Session list item
  └─[Delete button]─► Supabase delete ─► fetchSessions() ─► item removed
  └─[Supabase error]─► deleteError message shown above the session list
```

No confirmation dialog. Deletion is immediate.

---

### Journey 7 — Calendar heatmap

```
/dashboard
  └─[Calendar link]─► /calendar
       └─[← Prev button]─► Previous month displayed, selectedDate cleared
       └─[Next → button]─► Next month displayed, selectedDate cleared
       └─[Click a day cell]─► Session detail panel expands below calendar
            Shows: all sessions for that date (hours, minutes, notes)
            └─[Click same cell again]─► Detail panel collapses
       └─[Dashboard link]─► /dashboard
```

**Read-only:** No session creation or editing on this page.
**Data scope:** All sessions ever (not filtered by displayed month).
**Today indicator:** `ring-2 ring-teal-400 font-bold` on the current date cell.
**Empty day:** `bg-gray-700 text-gray-500` — no time sub-label shown.

---

### Journey 8 — Logout

```
/dashboard
  └─[Log out button]─► supabase.auth.signOut() ─► router.push('/login')
```

---

### Journey 9 — Accessing a protected route while unauthenticated

```
/dashboard or /calendar (direct URL, no valid session)
  └─ useAuth() detects no session ─► router.push('/login')
  (dashboard loading state briefly shown: "Loading…" centered on gray-900 bg)
```

---

## Loading & Empty States

| Screen / Context | Loading State | Empty State |
|---|---|---|
| Dashboard (auth check) | `<p className="text-gray-400">Loading...</p>` centered | — |
| Dashboard session list | `<p className="text-gray-400 text-sm">Loading...</p>` | "No sessions logged today yet." |
| Stats cards | Cards hidden entirely until `allSessions.length > 0` | Stats section not rendered |
| Calendar (auth check) | `<p className="text-gray-400">Loading...</p>` centered | — |
| Calendar grid | `<p className="text-gray-400 text-sm text-center py-8">Loading...</p>` | Cells render in gray (0-minute style) |
| Calendar detail panel | — | "No sessions logged on this day." |
| Reset password page | "Verifying reset link..." (then expired message after 5s) | — |

---

## Error States

| Context | Error display |
|---|---|
| Login form | `text-red-400 text-sm` inline in form |
| Signup form | `text-red-400 text-sm` inline in form |
| Forgot password form | `text-red-400 text-sm` inline in form |
| Reset password form | `text-red-400 text-sm` inline in form |
| Dashboard: log session | `formError` → `text-red-400 text-sm` inline in form |
| Dashboard: inline edit | `editError` → `text-red-400 text-sm` inside the inline form |
| Dashboard: delete | `deleteError` → `text-red-400 text-sm` above the session list |
| Runtime error (any page) | `app/error.js` → "Something went wrong" + error message + "Try again" button |
| Unknown route | `app/not-found.js` → "404 / Page not found" + "Go home" button |
| Reset link expired | Inline state on `/reset-password`: "Reset link is invalid or expired" |
