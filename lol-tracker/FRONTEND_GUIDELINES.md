# FRONTEND_GUIDELINES.md — Gaming Time Tracker

> Documents how the UI is actually engineered today. No prescriptive recommendations — observation only.

---

## Folder Structure

```
lol-tracker/
├── app/                        ← Next.js App Router root
│   ├── globals.css             ← Global stylesheet (single @import "tailwindcss" + body defaults)
│   ├── layout.js               ← Root layout: HTML shell, Google Fonts, metadata
│   ├── page.js                 ← Route /  (landing page, Server Component)
│   ├── error.js                ← Global error boundary (Client Component)
│   ├── not-found.js            ← Global 404 page (Server Component)
│   ├── login/page.js           ← Route /login
│   ├── signup/page.js          ← Route /signup
│   ├── forgot-password/page.js ← Route /forgot-password
│   ├── reset-password/page.js  ← Route /reset-password
│   ├── dashboard/page.js       ← Route /dashboard (protected)
│   └── calendar/page.js        ← Route /calendar (protected)
│
├── lib/
│   ├── supabaseClient.js       ← Singleton Supabase client
│   ├── useAuth.js              ← Auth guard custom hook
│   └── utils.js                ← Pure utility functions (formatTime, localDateStr)
│
└── public/                     ← Static assets (default Next.js SVGs only)
```

**Conventions observed:**
- Each route is a single `page.js` file directly in its route folder. No shared layout files per route group.
- No `components/` directory exists — all components are defined inline within their `page.js` files (helper functions and sub-renders live in the same file).
- Shared logic lives in `lib/` (3 files total).
- No `styles/` directory — global CSS is `app/globals.css`.

---

## Component Patterns

### Composition

No component composition pattern is in use. Each page file is self-contained: it defines all helper functions (e.g., `computeStats`, `buildCalendarGrid`, `getIntensityClass`) and renders the entire page in a single `default` export.

There are no shared components. Repeated UI patterns (e.g., the auth card shell, the input element, the primary button) are copy-pasted across page files.

### Variants

No variant system (CVA, clsx with variant maps, or similar). Class strings are assembled via template literals at the point of use.

Example of the only dynamic class logic in the codebase:
```js
// app/calendar/page.js:153-158
className={`
  aspect-square rounded-lg ...
  ${getIntensityClass(mins)}
  ${isToday ? 'ring-2 ring-teal-400 font-bold' : ''}
  ${isSelected && !isToday ? 'ring-2 ring-teal-600 ...' : ''}
  ${isSelected && isToday ? 'ring-2 ring-teal-400 ...' : ''}
`}
```

### classnames / clsx utility

Not installed. Raw template literals used for conditional classes.

### Helper functions co-located in page files

| Function | File | Purpose |
|---|---|---|
| `computeStats(allSessions)` | `app/dashboard/page.js:10` | Pure: calculates 6 stats from session array |
| `getIntensityClass(minutes)` | `app/calendar/page.js:11` | Pure: maps minutes → Tailwind class string |
| `buildCalendarGrid(year, month)` | `app/calendar/page.js:20` | Pure: builds flat day array for 7-col grid |

---

## Theming Approach

### Dark mode

The app is **always dark**. There is no light mode and no toggle. Dark theme is enforced by:
1. `background: #111827` on `body` in `globals.css:4`
2. `bg-gray-900` on every page's root `<div>`

No Tailwind `dark:` variant is used anywhere. No `prefers-color-scheme` media query.

### CSS Variables

Two font CSS variables are set by Next.js font loading:
- `--font-geist-sans`
- `--font-geist-mono`

No color or spacing CSS variables exist. All design values are inline Tailwind classes.

### No custom Tailwind config

Tailwind v4 is used without a `tailwind.config.js`. The `postcss.config.mjs` enables the `@tailwindcss/postcss` plugin. `globals.css` has only `@import "tailwindcss"` with no `@theme` customizations.

---

## Server vs Client Component Split

| File | Directive | Type |
|---|---|---|
| `app/layout.js` | none | Server Component |
| `app/page.js` | none | Server Component |
| `app/not-found.js` | none | Server Component |
| `app/error.js` | `'use client'` | Client Component (required by Next.js) |
| `app/login/page.js` | `'use client'` | Client Component |
| `app/signup/page.js` | `'use client'` | Client Component |
| `app/forgot-password/page.js` | `'use client'` | Client Component |
| `app/reset-password/page.js` | `'use client'` | Client Component |
| `app/dashboard/page.js` | `'use client'` | Client Component |
| `app/calendar/page.js` | `'use client'` | Client Component |
| `lib/useAuth.js` | `'use client'` | Client-only hook |
| `lib/supabaseClient.js` | none | Isomorphic module (used only in client components) |
| `lib/utils.js` | none | Pure functions (no React, safe anywhere) |

---

## Accessibility Conventions (as implemented)

### Labels

All form inputs have associated `<label>` elements with matching `htmlFor`/`id` pairs:
- `app/login/page.js:36-38` — email, password labels
- `app/signup/page.js` — same pattern
- `app/dashboard/page.js:246-248` — Hours, Minutes, Date, Notes labels

Inline-edit inputs inside list items use `<label>` elements with `text-xs` (smaller size, no `id` linkage observed — labels use only visual positioning).

### ARIA

No explicit `aria-*` attributes are used anywhere in the codebase.

No `role` attributes beyond implicit HTML semantics (`<button>`, `<form>`, `<input>`, `<label>`, `<ul>`, `<li>`).

No `aria-live` region for error messages or loading states.

No `aria-label` on icon-only buttons (there are no icon-only buttons — all buttons have visible text).

### Focus management

`focus:outline-none focus:ring-2 focus:ring-teal-500` on all form inputs. Buttons do not have explicit focus ring styles.

### Keyboard interaction

Calendar cells are `<button>` elements — keyboard-navigable by default. No explicit `tabIndex` manipulation.

### Color contrast

[Inference] `text-gray-400` (`#9ca3af`) on `bg-gray-800` (`#1f2937`) likely fails WCAG AA for normal text (estimated contrast ~4.0:1 at the boundary). Not verified with a contrast tool.

---

## Responsiveness Conventions (as implemented)

### Breakpoints

**No responsive breakpoints are used.** The codebase contains zero `sm:`, `md:`, `lg:`, `xl:`, or `2xl:` prefixed Tailwind classes.

### Container / Width

All main content is wrapped in:
```
max-w-2xl mx-auto
```
(`max-w-2xl` = 672px). On screens narrower than 672px, the content expands to fill the viewport minus the `p-8` page padding (32px each side), so on a 390px viewport the effective content width is ~326px.

Auth pages use `max-w-md` (448px) for the card with `w-full` ensuring it fills narrow screens.

### Grid behavior on narrow screens

The 3×2 stat card grid (`grid-cols-3`) has no responsive collapse — on mobile (~326px wide), each of the 3 columns is ~100px wide, which is narrow but functional.

The calendar grid (`grid-cols-7`) similarly has no responsive override — on mobile each cell is approximately 326/7 ≈ 46px wide.

The form row with 3 inputs side-by-side (`flex gap-4` with three `flex-1` children) does not wrap on mobile.

**No mobile-specific layout exists.** The design was built at a fixed intermediate width and will render compressed on small screens.
