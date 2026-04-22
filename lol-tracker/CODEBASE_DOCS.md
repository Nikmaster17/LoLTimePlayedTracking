# lol-tracker — Complete Codebase Documentation

> **Dual-audience document.** Sections labeled **(Agent)** are structured for AI/tool consumption. Sections labeled **(Beginner)** are written in plain English with no assumed expertise. Many sections serve both and are labeled **(Both)**.
>
> Every factual claim is traced to a specific file. Claims not verified directly from source are marked **[INFERRED]**.

---

## 1. System Overview (Both)

### What it does (plain English)

Gaming Time Tracker is a personal web app where you log how much time you spent gaming each day. Once you log in, you can record sessions ("I played for 2 hours 30 minutes today"), view statistics like your daily total, weekly total, monthly total, longest session, current streak, and daily average, and browse a colour-coded calendar heatmap showing every day you gamed and how long. You can also edit or delete any session you've logged.

Despite the repo name `lol-tracker` (short for League of Legends), the app is game-agnostic — there is no integration with Riot Games or any gaming platform. It is a general-purpose time logger with a gaming theme.

### How it is accessed

The app runs in a web browser. Users visit the root URL, sign up or log in, and are taken to the dashboard. Authentication is email + password, managed by Supabase Auth. Each user only sees their own sessions.

### Architecture in one paragraph (Agent)

Single-page Next.js 16 application using the App Router. All pages are React Client Components (no Server Components used beyond the root layout). There are no Next.js API Routes — all database reads and writes happen directly from the browser via the Supabase JavaScript SDK, which communicates with Supabase's hosted PostgREST REST API. Authentication tokens are stored by the Supabase SDK in browser localStorage [INFERRED — Supabase JS SDK default]. Row-Level Security on the Supabase database side ensures users can only access their own rows. Styling is Tailwind CSS 4 with no component library. State is managed with plain React hooks; there is no global state manager.

---

## 2. Folder & File Structure (Agent)

```
lol-tracker/
├── app/                        ← Next.js App Router root
│   ├── globals.css             ← Global stylesheet (Tailwind import + body defaults)
│   ├── layout.js               ← Root layout: HTML shell, font loading, metadata
│   ├── page.js                 ← Route: /   (landing / marketing page)
│   ├── login/
│   │   └── page.js             ← Route: /login   (email+password sign-in form)
│   ├── signup/
│   │   └── page.js             ← Route: /signup  (account creation form)
│   ├── dashboard/
│   │   └── page.js             ← Route: /dashboard  (main tracker UI, CRUD, stats)
│   └── calendar/
│       └── page.js             ← Route: /calendar  (heatmap calendar view)
│
├── lib/
│   ├── supabaseClient.js       ← Singleton Supabase client (shared across all pages)
│   └── useAuth.js              ← Custom React hook: session check + auth redirect guard
│
├── .env.local                  ← Environment variables (NOT committed to git [INFERRED])
├── next.config.mjs             ← Next.js config (empty/default)
├── postcss.config.mjs          ← PostCSS config (Tailwind CSS 4 plugin)
├── jsconfig.json               ← JS path aliases: @/* maps to project root
├── eslint.config.mjs           ← ESLint flat config (Next.js core-web-vitals rules)
├── package.json                ← Dependencies and npm scripts
├── CLAUDE.md                   ← AI assistant instructions (references AGENTS.md)
└── AGENTS.md                   ← Codebase-specific instructions for AI agents
```

**Entry points:** `app/layout.js` (HTML shell), `app/page.js` (first route served).
**Generated folders (do not edit):** `.next/` (build output), `node_modules/`.
**Config files:** `next.config.mjs`, `postcss.config.mjs`, `jsconfig.json`, `eslint.config.mjs`.

---

## 3. Tech Stack & Dependencies (Both)

### Production Dependencies (`package.json:dependencies`)

| Package | Version | What it is | Why it's here |
|---|---|---|---|
| `next` | 16.2.4 | The Next.js framework | Provides routing, server-side rendering capability, build tooling, and the development server |
| `react` | 19.2.4 | React UI library | Powers all the interactive UI components |
| `react-dom` | 19.2.4 | React renderer for the browser | The bridge that puts React components onto the actual webpage |
| `@supabase/supabase-js` | ^2.104.0 | Supabase SDK | Provides the client for talking to the Supabase database and authentication system |

### Dev Dependencies (`package.json:devDependencies`)

| Package | Version | What it is | Why it's here |
|---|---|---|---|
| `tailwindcss` | ^4 | CSS utility framework | Provides thousands of ready-made CSS classes for styling (e.g., `bg-blue-600`, `rounded-xl`) |
| `@tailwindcss/postcss` | ^4 | Tailwind CSS 4 PostCSS plugin | Processes Tailwind CSS 4's new CSS-based config during the build |
| `eslint` | ^9 | Code linter | Catches bugs and style issues automatically while writing code |
| `eslint-config-next` | 16.2.4 | Next.js ESLint rules | Pre-configured rules optimised for Next.js projects |

### Beginner explainer: what is each tool?

- **Next.js** is like a smart filing cabinet for your website. It organises your files into pages automatically (a file called `app/login/page.js` becomes the `/login` URL), and it handles a lot of behind-the-scenes work like making pages fast.
- **React** is the language you use to describe what the screen should look like. Instead of writing raw HTML, you write components — reusable UI pieces — and React figures out how to update the screen efficiently.
- **Supabase** is your backend in the cloud. It gives you a PostgreSQL database, a login system, and an API — all pre-built. You don't need to write a server yourself.
- **Tailwind CSS** is a bag of pre-written CSS. Instead of writing CSS like `color: white; background: blue; border-radius: 8px`, you write class names like `text-white bg-blue-600 rounded-xl` directly in your HTML.
- **ESLint** is a robot that reads your code and points out mistakes (like missing brackets, or code patterns that tend to cause bugs) before you even run it.

---

## 4. How The App Starts (Beginner Walkthrough)

Here is the story of what happens from the moment you open your browser and type the app's URL.

**Step 1 — The browser asks Next.js for a page.**
Next.js receives the request for `/` (the homepage). It looks in `app/page.js` and finds the `Home` component.

**Step 2 — Next.js wraps the page in the root layout.**
Before serving `Home`, Next.js wraps it in `app/layout.js`. The layout adds the `<html>` and `<body>` tags, loads two fonts from Google Fonts (Geist Sans and Geist Mono), and applies the global CSS from `app/globals.css`. This layout wraps *every* page in the app, not just the homepage.

**Step 3 — The landing page is shown.**
`app/page.js` renders a centered card with the app title, a description, and two buttons: "Log in" and "Sign up". These are Next.js `<Link>` components — clicking them navigates to `/login` or `/signup` without a full browser reload.

**Step 4 — The user logs in.**
On `/login`, the `LoginPage` component renders a form. When the user submits it, the `handleSubmit` function calls `supabase.auth.signInWithPassword({ email, password })`. The Supabase SDK sends the credentials to Supabase's authentication servers. If correct, Supabase returns a session token, and the SDK stores it locally. The page then navigates to `/dashboard`.

**Step 5 — The dashboard loads and checks auth.**
`app/dashboard/page.js` calls the custom hook `useAuth()` from `lib/useAuth.js`. `useAuth` immediately calls `supabase.auth.getSession()` — this checks if a valid session token is stored locally. If there is no session, it redirects the browser to `/login`. If there is a valid session, it returns the user object so the page knows who is logged in.

**Step 6 — Sessions are fetched from the database.**
Once `user` is available (not null), a `useEffect` triggers `fetchSessions()`. This calls `supabase.from('sessions').select('*').order('session_date', { ascending: false })`. Supabase's PostgREST API translates this into a SQL query and returns all rows from the `sessions` table that belong to the logged-in user (thanks to Row-Level Security on the database side). The results are stored in React state.

**Step 7 — Stats are computed and the dashboard renders.**
With all sessions in hand, the `computeStats()` function calculates today's total minutes, this week's total, this month's total, the current streak, the daily average, and the longest single session — all by looping through the session data. These numbers are displayed in a 3×2 grid of stat cards.

**Step 8 — The user logs a new session.**
The form at the bottom of the dashboard collects hours, minutes, an optional date (defaults to today), and optional notes. On submit, `handleSubmit` calls `supabase.from('sessions').insert(...)`, which writes the new row to the database. Then `fetchSessions()` runs again to refresh the displayed data.

---

## 5. Module-by-Module Breakdown (Agent)

---

### `lib/supabaseClient.js`

**Purpose:** Creates and exports a single, shared Supabase client instance used by every file in the project.

**Inputs:** Environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (read at module load time via `process.env`).

**Outputs:** Named export `supabase` — a `SupabaseClient` instance from `@supabase/supabase-js`.

**Key call:**
```js
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
// supabaseUrl: string — the HTTPS URL of the Supabase project
// supabaseAnonKey: string — JWT token for anonymous/public access
```

**Dependencies:** `@supabase/supabase-js` → `createClient`.

**Depended on by:** `lib/useAuth.js`, `app/login/page.js`, `app/signup/page.js`, `app/dashboard/page.js`, `app/calendar/page.js`.

**Side effects:** Module-level singleton. The client is created once and reused; calling `createClient` again is unnecessary and avoided.

**Beginner note:** Think of this file like a phone book entry. Every part of the app that needs to talk to the database looks up this file and uses the same "phone" (client). If you had two clients, they might get confused about which session is active.

---

### `lib/useAuth.js`

**Purpose:** Custom React hook that checks if a user is logged in and redirects to `/login` if not. Also subscribes to auth state changes (e.g., session expiry).

**Signature:** `function useAuth(): { user: User | null, loading: boolean }`

**Returns:**
- `user` — Supabase `User` object (`{ id, email, ... }`) or `null` while loading.
- `loading` — `true` until the session check completes; prevents flash of wrong content.

**Internal state:**
- `useState(null)` → `user`
- `useState(true)` → `loading`

**Key logic:**
1. On mount: calls `supabase.auth.getSession()`. If no session → `router.push('/login')`. If session → `setUser(session.user)`. Always → `setLoading(false)`.
2. Subscribes to `supabase.auth.onAuthStateChange(...)` to catch session changes (login on another tab, token expiry, signout). Same redirect logic.
3. Cleanup: `subscription.unsubscribe()` on component unmount.

**Dependencies:** `react` (`useEffect`, `useState`), `next/navigation` (`useRouter`), `@/lib/supabaseClient` (`supabase`).

**Depended on by:** `app/dashboard/page.js`, `app/calendar/page.js`.

**Marked `'use client'`** — cannot run on the server.

**Beginner note:** This hook is like a bouncer at the door of protected pages. Every protected page calls `useAuth()` at the top. If you're not logged in, the bouncer immediately turns you around and sends you to the login page.

---

### `app/layout.js`

**Purpose:** Root Next.js layout — wraps every page with the HTML document shell.

**Exports:** `default RootLayout({ children })` — renders `<html>` and `<body>` with font CSS variables and antialiasing.

**Exports also:** `metadata` object `{ title: "Create Next App", description: "..." }` — Next.js uses this to set the `<title>` and meta description tags. **[NOTE: This is still the default Next.js boilerplate value and has not been updated for this project.]**

**Fonts loaded:** `Geist` (sans-serif) and `Geist_Mono` (monospace) from `next/font/google`. These are loaded at build time, not from a `<link>` tag, so they are self-hosted automatically by Next.js.

**Side effects:** Applies `globals.css` globally — all pages share these base styles.

---

### `app/page.js`

**Purpose:** Landing page at route `/`. Static marketing/entry page — no auth, no data fetching.

**Renders:** Centered card with app title, description, and two `<Link>` buttons → `/login` and `/signup`.

**No state, no effects, no client-side JavaScript** — this is a React Server Component (no `'use client'` directive).

---

### `app/login/page.js`

**Purpose:** Email + password login form at route `/login`.

**Marked `'use client'`.**

**State:**
- `email: string` — controlled input
- `password: string` — controlled input
- `error: string | null` — error message from Supabase
- `loading: boolean` — disables button during request

**Key function:**
```js
async function handleSubmit(e)
// Calls: supabase.auth.signInWithPassword({ email, password })
// On success: router.push('/dashboard')
// On error: sets error state with error.message
```

**Renders:** Form with email/password inputs, error display, submit button, link to `/signup`.

---

### `app/signup/page.js`

**Purpose:** Account creation form at route `/signup`.

**Marked `'use client'`.**

**State:**
- `email: string`, `password: string` — controlled inputs
- `error: string | null`, `message: string | null` — error or success message
- `loading: boolean`

**Key function:**
```js
async function handleSubmit(e)
// Calls: supabase.auth.signUp({ email, password })
// On success: sets message "Account created! Check your email to confirm, then log in."
// On error: sets error state
// NOTE: Does NOT auto-redirect — user must confirm email first [INFERRED from message text]
```

**Password constraint:** `minLength={6}` enforced at the HTML input level.

---

### `app/dashboard/page.js`

**Purpose:** Main app page at route `/dashboard`. Handles session CRUD, statistics display, and today's session list.

**Marked `'use client'`.** Protected by `useAuth()`.

**Key pure functions (no side effects):**

```js
function formatTime(totalMinutes: number): string
// Converts minutes to human-readable string
// 0 → "0m", 90 → "1h 30m", 120 → "2h"

function computeStats(allSessions: Session[]): Stats
// Input: array of all session rows
// Output: { todayMinutes, weekMinutes, monthMinutes, longestSession, streak, avgMinutes }
// Streak algorithm: counts consecutive days backward from today where dateSet.has(dateStr)
```

**State (13 pieces):**
| State var | Type | Purpose |
|---|---|---|
| `allSessions` | `Session[]` | All sessions from DB |
| `todaySessions` | `Session[]` | Filtered: today only |
| `sessionsLoading` | `boolean` | Loading indicator |
| `editingId` | `string \| null` | ID of session being edited |
| `stats` | `Stats \| null` | Computed stat object |
| `hours` | `number` | New session form |
| `minutes` | `number` | New session form |
| `notes` | `string` | New session form |
| `sessionDate` | `string` | New session form (ISO date) |
| `submitting` | `boolean` | Form submit guard |
| `formError` | `string \| null` | Form validation error |
| `editHours`, `editMinutes`, `editNotes`, `editDate` | various | Inline edit form fields |

**Key async functions:**

```js
const fetchSessions = useCallback(async () => void)
// Reads: supabase.from('sessions').select('*').order('session_date', { ascending: false })
// Writes: setAllSessions, setTodaySessions, setStats

async function handleSubmit(e): void
// Validates: hours+minutes > 0
// Writes: supabase.from('sessions').insert({ user_id, hours, minutes, notes, session_date })
// Then: calls fetchSessions()

async function handleEdit(id: string): void
// Writes: supabase.from('sessions').update({ hours, minutes, notes, session_date, updated_at }).eq('id', id)
// Then: calls fetchSessions()

async function handleDelete(id: string): void
// Writes: supabase.from('sessions').delete().eq('id', id)
// Then: calls fetchSessions()

async function handleLogout(): void
// Calls: supabase.auth.signOut()
// Then: router.push('/login')
```

**Hours/minutes constraint:** If hours === 24, minutes is forced to 0 (max session = exactly 24h).

**Navigation:** Header contains link to `/calendar` and a logout button.

---

### `app/calendar/page.js`

**Purpose:** Calendar heatmap view at route `/calendar`. Read-only display — no session creation or editing.

**Marked `'use client'`.** Protected by `useAuth()`.

**Key pure functions:**

```js
function formatTime(totalMinutes: number): string
// Same as dashboard version, except 0 returns '—' (em dash) instead of '0m'

function getIntensityClass(minutes: number): string
// Maps minutes to Tailwind CSS class pair (background + text color)
// 0       → 'bg-gray-100 text-gray-400'
// 1–30    → 'bg-blue-100 text-blue-800'
// 31–60   → 'bg-blue-200 text-blue-800'
// 61–120  → 'bg-blue-400 text-white'
// 121–180 → 'bg-blue-600 text-white'
// 181+    → 'bg-blue-800 text-white'

function buildCalendarGrid(year: number, month: number): (number | null)[]
// Builds a flat array for a 7-column grid (Mon–Sun week start)
// null values = empty cells before the 1st and after the last day
// Length is always a multiple of 7
```

**State:**
- `viewYear`, `viewMonth` — currently displayed month
- `minutesByDate: { [dateStr]: number }` — total minutes per date key
- `sessionsByDate: { [dateStr]: Session[] }` — session list per date key
- `sessionsLoading: boolean`
- `selectedDate: string | null` — clicked date (shows detail panel)

**Data flow:** Fetches ALL sessions once (no date filter), then aggregates into `minutesByDate` and `sessionsByDate` on the client side.

**Calendar rendering:** Grid of 7 columns, each cell is a `<button>` that toggles `selectedDate`. Today's cell gets a `ring-2 ring-blue-500` outline. Selected date shows a detail panel below the calendar listing all sessions for that day.

**Week start:** Monday (ISO week standard). Achieved by remapping Sunday (JS day 0) to position 6.

**Legend:** Static colour legend displayed below the calendar.

**Navigation:** Prev/Next month buttons (wraps year correctly). Link back to `/dashboard`.

---

## 6. Data Flow & State Management (Both)

### Data flow diagram (text)

```
Browser (React)
    │
    ├─ supabase.auth.signInWithPassword()  ──►  Supabase Auth API
    │                                           (returns session token)
    │
    ├─ supabase.from('sessions').select()  ──►  Supabase PostgREST API
    │                                      ◄──  JSON array of session rows
    │
    ├─ supabase.from('sessions').insert()  ──►  Supabase PostgREST API
    │                                           (writes row, no return needed)
    │
    ├─ supabase.from('sessions').update()  ──►  Supabase PostgREST API
    │
    └─ supabase.from('sessions').delete()  ──►  Supabase PostgREST API
```

### How data enters the system

1. User fills in the "Log a Session" form on `/dashboard`.
2. `handleSubmit` calls `supabase.from('sessions').insert(...)` with `user_id`, `hours`, `minutes`, `notes`, and `session_date`.
3. The Supabase SDK sends a POST request to the Supabase REST API.
4. Supabase validates the JWT token, applies Row-Level Security rules, and inserts the row.
5. `fetchSessions()` is called, re-reads all rows, and updates React state.

### Where state lives

All state is **page-local React state** (`useState`). There is no global state manager, no React Context, and no Redux. This means:
- Dashboard state and Calendar state are completely separate.
- Both pages fetch from the database independently.
- A new session logged on Dashboard will appear on Calendar only after the Calendar page re-fetches (i.e., when it mounts or remounts).

### Beginner note: what is React state?

Imagine React state as sticky notes on a whiteboard. Each page has its own whiteboard. When you write a new gaming session, React updates the sticky notes and redraws the screen to match. The sticky notes don't survive when you navigate away — they're reset when you come back. The permanent record is in the Supabase database.

---

## 7. External Integrations & APIs (Agent)

### Supabase

**What it provides:**
1. **Auth** — Email/password sign-up and sign-in. JWT session tokens.
2. **Database** — PostgreSQL accessed via the PostgREST REST API (no raw SQL from client).

**Configuration:**
- `NEXT_PUBLIC_SUPABASE_URL` — HTTPS endpoint for the Supabase project (e.g., `https://<ref>.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public JWT (safe to expose in the browser; scoped to anonymous/authenticated access only)

**Auth endpoints used (via SDK, not raw fetch):**
- `supabase.auth.signInWithPassword({ email, password })`
- `supabase.auth.signUp({ email, password })`
- `supabase.auth.signOut()`
- `supabase.auth.getSession()`
- `supabase.auth.onAuthStateChange(callback)`

**Database table: `sessions`**

Inferred schema from query patterns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid or bigint | Primary key [INFERRED from `.eq('id', id)` usage] |
| `user_id` | uuid | Foreign key → auth.users; used in insert |
| `session_date` | date (string) | ISO format `YYYY-MM-DD` |
| `hours` | integer | 0–24 |
| `minutes` | integer | 0–59 |
| `notes` | text \| null | Optional |
| `updated_at` | timestamptz | Set manually on update via `new Date().toISOString()` |

**Row-Level Security:** [INFERRED] RLS must be enabled on the `sessions` table. The client uses only the anon key with a user JWT, so Supabase enforces that `user_id = auth.uid()` server-side. Without RLS, any logged-in user could read all users' sessions.

**Failure behavior:** All Supabase calls return `{ data, error }`. Errors are displayed to the user via state (`formError`, `error`). There is no retry logic or offline fallback.

### Google Fonts

**What it provides:** Web fonts — Geist Sans and Geist Mono.

**How loaded:** Via `next/font/google` in `app/layout.js`. Next.js downloads these fonts at build time and self-hosts them, eliminating a runtime network request to Google's servers.

**No API key required.**

---

## 8. Environment & Configuration (Both)

### Environment variables

| Variable | File | What it controls | What breaks if missing |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | The URL of your Supabase project | `supabaseClient.js` passes `undefined` to `createClient` → all DB and auth calls fail with a connection error |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | The public JWT for Supabase access | Same as above — `createClient` is called with `undefined` → all calls fail |

### Prefixed with `NEXT_PUBLIC_`

Both variables are prefixed with `NEXT_PUBLIC_`. In Next.js, this prefix means the variable is **intentionally exposed to the browser**. Non-prefixed variables are server-only. Since this app has no server-side code (no API routes, no Server Components that read env vars), all variables are public. The Supabase anon key is designed to be public — it only allows what your Supabase Row-Level Security rules permit.

### Other configuration files

| File | What it controls |
|---|---|
| `next.config.mjs` | Next.js build options (currently empty/default) |
| `postcss.config.mjs` | Enables Tailwind CSS 4 via PostCSS plugin |
| `jsconfig.json` | Path alias: `@/*` resolves to the project root, so `@/lib/supabaseClient` means `./lib/supabaseClient` |
| `eslint.config.mjs` | ESLint rules (Next.js core-web-vitals preset, flat config format) |

### Beginner note: what is a `.env.local` file?

Environment variables are like secret settings that your app reads but that don't live inside the code itself. The `.env.local` file is where you store them. It is (or should be) in your `.gitignore` so it never gets uploaded to GitHub — this prevents your credentials from becoming public. In this project, the Supabase URL and key are stored here. When Next.js starts (`npm run dev`), it reads this file automatically.

---

## 9. Known Gaps & Inferences (Agent)

| # | Gap / Inference | Confidence | Source |
|---|---|---|---|
| 1 | Supabase Row-Level Security is enabled on the `sessions` table | High | Required for security; the anon key alone would expose all users' data without it |
| 2 | `sessions.id` is the primary key (uuid or bigint) | High | Used in `.eq('id', id)` for update/delete |
| 3 | Email confirmation is required before login | Medium | Signup success message says "Check your email to confirm, then log in" — but this depends on Supabase project settings |
| 4 | Session tokens are stored in browser localStorage | High | Default behavior of Supabase JS SDK v2 |
| 5 | The `sessions` table has `created_at` column | Low | Never read in code; common Supabase convention but not confirmed |
| 6 | No database migrations file exists in this repo | High | No `migrations/` or `supabase/` directory found |
| 7 | `formatTime` is duplicated between `dashboard/page.js` and `calendar/page.js` with a slight difference (0 returns `"0m"` vs `"—"`) | Confirmed | Both files read directly |
| 8 | The app has no error boundary or 404/500 page | Confirmed | No `app/error.js` or `app/not-found.js` found in directory listing |
| 9 | The page `<title>` is still the default "Create Next App" | Confirmed | `app/layout.js:13` — `metadata.title` not updated |
| 10 | No loading skeleton/spinner on calendar for month navigation | Confirmed | `sessionsLoading` is only set during initial fetch; prev/next month click shows stale data briefly [INFERRED] |

**Suggestions for future documentation comments:**
- Add a comment on the `sessions` Supabase table schema (or include a `supabase/migrations/` folder).
- Document the RLS policy in the Supabase dashboard or in a `README`.
- Consider extracting `formatTime` to a shared `lib/utils.js` to remove the duplication.

---

## 10. Glossary (Beginner)

**API (Application Programming Interface)**
A defined way for two programs to talk to each other. Supabase exposes an API — your browser sends it requests ("give me all my sessions"), and it responds with data. You never write the server code; Supabase provides it.

**App Router**
The newer system Next.js uses to connect file names to URLs. A file at `app/dashboard/page.js` automatically becomes the page you see when you visit `/dashboard`. No extra routing configuration needed.

**Authentication (Auth)**
The process of proving who you are. In this app, you authenticate by entering your email and password. Supabase checks them and gives your browser a token — like a wristband at an event — that proves you're allowed in.

**Client Component**
A React component that runs in the browser (not on the server). In Next.js App Router, files marked `'use client'` at the top are Client Components. They can use hooks like `useState` and `useEffect`, and can respond to user interactions.

**Environment variable**
A setting stored outside your code — typically in a `.env.local` file — so that sensitive values (like API keys) don't end up in your source code. Your app reads them at startup.

**Hook (React hook)**
A special function in React that lets you "hook into" React features inside a component. `useState` lets you store values that the UI should react to. `useEffect` lets you run code when something changes (like fetching data after login). A "custom hook" like `useAuth` is a regular function that uses built-in hooks internally.

**JWT (JSON Web Token)**
A secure, self-contained piece of text that proves your identity. After logging in, Supabase gives your browser a JWT. Your browser sends it with every database request so Supabase knows it's you.

**PostgREST**
A tool that automatically turns a PostgreSQL database into a REST API. Supabase uses it under the hood. When you call `supabase.from('sessions').select('*')`, the SDK is sending an HTTP request to a PostgREST endpoint, which runs the equivalent SQL and returns JSON.

**PostgreSQL**
A powerful open-source database. Supabase uses it to store all your data. Your sessions are rows in a PostgreSQL table.

**React**
A JavaScript library for building user interfaces. Instead of manually updating the page when data changes, you describe what the page *should* look like for any given data, and React efficiently updates just the parts that changed.

**React State**
Data stored inside a component that, when changed, causes the component to re-render (redraw itself). Think of it as the component's memory. It resets when you navigate away from the page.

**Row-Level Security (RLS)**
A Supabase/PostgreSQL feature where the database itself enforces access rules. Even if someone had your Supabase anon key, RLS ensures they can only read rows where `user_id` matches their own ID. The database rejects other queries before they even run.

**Server Component**
A React component that runs on the server (or at build time) rather than in the browser. They can't use hooks or handle user interactions, but they can fetch data securely. In this project, only `app/page.js` and `app/layout.js` are Server Components.

**Singleton**
An object that is created only once and reused everywhere. `lib/supabaseClient.js` exports a singleton Supabase client — the whole app shares one connection instead of creating a new one on every page.

**Supabase**
A cloud platform (similar to Firebase) that gives you a PostgreSQL database, authentication system, and API without writing a backend. The free tier is sufficient for small personal projects.

**Tailwind CSS**
A CSS framework where you style things by adding pre-defined class names directly to your HTML elements. Instead of writing CSS in a separate file, you write `className="bg-blue-600 text-white rounded-xl p-4"` and get a blue card with white text, rounded corners, and padding.

**`useCallback`**
A React hook that prevents a function from being recreated on every render unless its dependencies change. Used in this project to prevent `fetchSessions` from triggering infinite re-fetch loops in `useEffect`.

**`useEffect`**
A React hook that runs code in response to something changing. In this project, it is used to fetch sessions from the database after the user is confirmed logged in: "when `user` changes and is no longer null, run `fetchSessions()`".

**`useState`**
The most basic React hook. It creates a variable and a function to update it. When you call the update function, React re-renders the component with the new value.
