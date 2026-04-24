# LESSONS.md — Design & System Mistakes Discovered

> Observation log only. No fixes proposed here. These are patterns found in the current codebase.

---

## L1 — No Design Token Layer

**What was found:** Every color, spacing value, border radius, and shadow appears as a raw Tailwind utility class directly in JSX. There are no CSS variable aliases (e.g., `--color-surface`), no Tailwind `@theme` customizations, and no shared constants.

**Evidence:** `app/globals.css` contains only `@import "tailwindcss"` with no `@theme {}` block. All color decisions are repeated inline across 10+ files.

**Impact:** A single palette change (e.g., swapping `amber-400` for `yellow-400` as the brand color) requires a find-and-replace across every page file. Token drift is invisible until it appears visually.

---

## L2 — No Shared Component Abstractions

**What was found:** There is no `components/` directory. Every repeated UI pattern — the card shell, the primary button, the text input, the error message paragraph — is copy-pasted across page files with minor variations.

**Evidence:**
- Primary button class string duplicated verbatim in: `app/page.js:12`, `app/login/page.js:63`, `app/signup/page.js:67`, `app/dashboard/page.js:293`, `app/forgot-password/page.js:54`, `app/reset-password/page.js:81`, `app/error.js:14`, `app/not-found.js:11`.
- Auth card shell (`w-full max-w-md bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8`) duplicated across login, signup, forgot-password, reset-password pages.
- Input class string duplicated across all form pages.

**Impact:** Visual drift already exists: inline-edit inputs use `rounded` (not `rounded-lg`) because they were authored separately. Duplicate code means bugs and inconsistencies compound rather than being fixed in one place.

---

## L3 — Inconsistent Border Radius on Inputs

**What was found:** Main form inputs use `rounded-lg`. Inline-edit inputs (the "edit session" form that appears inline in the today's session list) use `rounded`.

**Evidence:**
- `app/dashboard/page.js:257` — main form: `rounded-lg px-3 py-2`
- `app/dashboard/page.js:327` — inline edit: `rounded px-2 py-1 text-sm`

**Impact:** Within a single page, two different input styles coexist with no documented intent.

---

## L4 — No Responsive Design

**What was found:** Zero responsive Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`, etc.) are used across the entire codebase.

**Evidence:** Confirmed by grep — no breakpoint prefix classes found in any page or component file.

**Impact:** On mobile viewports (~390px), the 3-column stat card grid renders at roughly 100px per column, the horizontal 3-input form row does not stack, and the 7-column calendar renders cells at ~46px each. The app is functional but cramped on small screens.

---

## L5 — Accessibility Gaps

**What was found:**
1. No `aria-*` attributes anywhere in the codebase.
2. No `aria-live` regions for dynamic error messages or loading states — screen reader users won't hear errors appear.
3. Button focus states are browser default only (no explicit `focus:ring` on buttons).
4. `text-gray-400` on `bg-gray-800` is likely below WCAG AA contrast threshold for normal text [Inference — not measured].
5. The streak warning ("Play today to keep it!") uses `text-orange-400` with no icon or non-color indicator.

---

## L6 — Scattered State Management for a Single Data Source

**What was found:** Both `/dashboard` and `/calendar` independently fetch **all sessions** from Supabase on mount. They maintain separate local state and are not synchronized — a session logged on the dashboard is not visible on the calendar until the calendar page remounts.

**Evidence:** `app/dashboard/page.js:83-93` and `app/calendar/page.js:49-68` both issue identical unbounded `select('*')` queries.

**Impact:** Double the network requests. No shared cache. If a user logs a session and immediately switches to calendar, the new session appears absent until they navigate away and back.

---

## L7 — Stats Section Hidden When No Sessions Exist

**What was found:** The 6-stat card grid renders only when `stats && allSessions.length > 0`. New users who just signed up see only the "Log a Session" form and "Today's Sessions" section (empty state). There is no onboarding prompt or empty-state illustration to set context.

**Evidence:** `app/dashboard/page.js:209` — `{stats && allSessions.length > 0 && (...)}`

---

## L8 — No Confirmation on Destructive Action

**What was found:** The "Delete" button in the session list calls `handleDelete(id)` directly with no confirmation dialog.

**Evidence:** `app/dashboard/page.js:395-400`.

**Impact:** Sessions can be accidentally deleted with one click. There is no undo.

---

## L9 — Outdated CODEBASE_DOCS.md (at time of audit)

**What was found:** The existing `CODEBASE_DOCS.md` contains several claims that no longer match the current code:

| CODEBASE_DOCS.md claim | Actual current state |
|---|---|
| `app/error.js` does not exist (gap #8) | File now exists (`app/error.js`) |
| `app/not-found.js` does not exist (gap #8) | File now exists (`app/not-found.js`) |
| `metadata.title` is still "Create Next App" (gap #9) | Title is now "Gaming Time Tracker" |
| Calendar intensity uses blue classes (`bg-blue-100`, etc.) | Calendar uses teal classes (`bg-teal-900`, etc.) |
| `formatTime` duplicated in dashboard and calendar (gap #7) | Now shared via `lib/utils.js`; both pages import it |

**Impact:** Stale docs create false assumptions for agents and developers reading them.

---

## L10 — No Loading Skeleton or Perceived Performance Treatment

**What was found:** All loading states are text-only: `<p className="text-gray-400">Loading...</p>` or `<p className="text-gray-400 text-sm">Loading...</p>`. No skeleton screens, no shimmer, no progressive reveal.

**Evidence:** `app/dashboard/page.js:179-183`, `app/calendar/page.js:90-95`, `app/dashboard/page.js:305-306`, `app/calendar/page.js:129-131`.

---

## L11 — Week/Month Boundary Logic Is Dashboard-Only

**What was found:** The "This Week" stat uses Monday as week start (ISO standard), computed locally in `computeStats`. The "This Month" stat uses the first of the calendar month. These are hardcoded in a client-side function with no shared definition.

**Evidence:** `app/dashboard/page.js:14-19` (Monday logic), `app/dashboard/page.js:21` (month logic).

**Impact:** If the same time-range logic were ever needed in another component or a server-side context, it would need to be re-implemented. The logic is also not tested.
