# TECH_STACK.md — Gaming Time Tracker

> Evidence-based. Every claim cites a source file. Unverified inferences are marked [Inference].

---

## Runtime & Framework

| Item | Value | Source |
|---|---|---|
| Node runtime | Not pinned (no `.nvmrc` or `engines` field) | `package.json` |
| Next.js | **16.2.4** (App Router) | `package.json:14` |
| React | **19.2.4** | `package.json:13` |
| react-dom | **19.2.4** | `package.json:15` |

**Routing approach:** Next.js App Router. Routes are defined by filesystem convention under `app/`. All pages currently in use are direct `app/<route>/page.js` files — no route groups, no parallel routes, no intercepting routes.

---

## Styling Stack

| Item | Value | Source |
|---|---|---|
| CSS framework | **Tailwind CSS v4** (utility-first) | `package.json:devDependencies`, `postcss.config.mjs` |
| PostCSS plugin | `@tailwindcss/postcss ^4` | `package.json:18`, `postcss.config.mjs:3` |
| CSS entry point | `app/globals.css` — single `@import "tailwindcss"` line | `app/globals.css:1` |
| Tailwind config file | **None** — Tailwind v4 CSS-first approach (no `tailwind.config.js`) | Filesystem (absent) |
| Custom design tokens | **None** — no `@theme` block, no CSS variable overrides | `app/globals.css` |
| Body base styles | `background: #111827; color: #f9fafb; font-family: Arial, Helvetica, sans-serif` | `app/globals.css:3-7` |

**Token source:** All Tailwind color/spacing/radius values are Tailwind v4 defaults. No custom theme extensions exist.

---

## Fonts

| Item | Value | Source |
|---|---|---|
| Geist Sans | Loaded via `next/font/google`, CSS var `--font-geist-sans` | `app/layout.js:1,4-7` |
| Geist Mono | Loaded via `next/font/google`, CSS var `--font-geist-mono` | `app/layout.js:1,8-11` |
| Fallback body font | Arial, Helvetica, sans-serif | `app/globals.css:6` |
| Self-hosted | Yes — Next.js downloads at build time, no runtime Google Fonts request | `app/layout.js` (next/font behavior) |

---

## UI Component Library

**None.** No shadcn/ui, Radix UI, MUI, Headless UI, or other component library is installed.

All UI primitives (buttons, inputs, cards, modals) are hand-authored HTML elements styled with Tailwind utility classes directly in page files.

---

## Motion / Animation

**None.** No Framer Motion, GSAP, or CSS animation library installed. The only motion present is Tailwind's `transition-opacity` on calendar cells (`app/calendar/page.js:154`).

---

## Form & Validation

| Item | Value | Source |
|---|---|---|
| Form library | **None** — plain React controlled components | All page files |
| Validation | HTML5 native (`required`, `type="email"`, `minLength={6}`, `min`/`max` on number inputs) + manual JS checks | `app/login/page.js:39-46`, `app/signup/page.js:58`, `app/dashboard/page.js:107-109` |
| Error display | Inline `<p className="text-red-400 text-sm">` beneath the form | All page files |

---

## Authentication

| Item | Value | Source |
|---|---|---|
| Provider | **Supabase Auth** (email + password) | `lib/supabaseClient.js`, all page files |
| SDK | `@supabase/supabase-js ^2.104.0` | `package.json:12` |
| Auth guard | Custom hook `useAuth()` — checks session, redirects to `/login` if none | `lib/useAuth.js` |
| Session storage | [Inference] Browser localStorage (Supabase JS SDK v2 default) | — |
| Password reset | Email link → `/reset-password` route, via `supabase.auth.resetPasswordForEmail()` | `app/forgot-password/page.js:19`, `app/reset-password/page.js` |

**Auth methods used:**
- `supabase.auth.signInWithPassword()` — `app/login/page.js:20`
- `supabase.auth.signUp()` — `app/signup/page.js:22`
- `supabase.auth.signOut()` — `app/dashboard/page.js:101`
- `supabase.auth.getSession()` — `lib/useAuth.js:13`
- `supabase.auth.onAuthStateChange()` — `lib/useAuth.js:22`, `app/reset-password/page.js:18`
- `supabase.auth.resetPasswordForEmail()` — `app/forgot-password/page.js:19`
- `supabase.auth.updateUser()` — `app/reset-password/page.js:35`

---

## API Patterns

| Item | Value | Source |
|---|---|---|
| API style | **Direct Supabase SDK calls** (PostgREST REST API under the hood) | All data-fetching code |
| Next.js API routes | **None** — no `app/api/` directory | Filesystem |
| Server Actions | **None** — all pages are `'use client'` | All page files |
| Server Components (data) | **None** — no server-side data fetching | All page files |
| Database table | `sessions` | `app/dashboard/page.js:83`, `app/calendar/page.js:53` |

**Operations:**
- `supabase.from('sessions').select('*').order(...)` — read all
- `supabase.from('sessions').insert({...})` — create
- `supabase.from('sessions').update({...}).eq('id', id)` — edit
- `supabase.from('sessions').delete().eq('id', id)` — delete

---

## State Management

**Plain React hooks only.** No Redux, Zustand, React Query, SWR, Jotai, or React Context.

| Pattern | Usage |
|---|---|
| `useState` | All local UI state (form fields, loading flags, error messages, session arrays) |
| `useEffect` | Session fetch on auth, auth state subscription on mount |
| `useCallback` | `fetchSessions` wrapped to stabilize reference for `useEffect` dependency |

State is **page-local** — dashboard and calendar each independently fetch all sessions from Supabase.

---

## Deployment

| Item | Value | Source |
|---|---|---|
| Platform | Vercel | `.vercel/project.json` |
| Environment vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (stored in `.env.local`, not committed) | `lib/supabaseClient.js:3-4` |
