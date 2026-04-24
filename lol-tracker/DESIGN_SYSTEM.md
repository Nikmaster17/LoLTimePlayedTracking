# DESIGN_SYSTEM.md — Gaming Time Tracker

> Extracted from code only. No design intent assumed. [Inference] marks anything not directly readable from source.
> System risk flags are marked ⚠️.

---

## Color Palette

All colors come from **Tailwind v4 default theme** (no custom `@theme` block in `globals.css`). The values below are the Tailwind v4 defaults for these color stops.

### Backgrounds

| Token (class) | Hex | Usage | Source |
|---|---|---|---|
| `bg-gray-900` | `#111827` | Page background (all screens) | `app/globals.css:4`, every page file |
| `bg-gray-800` | `#1f2937` | Card / panel surface | `app/dashboard/page.js:211,241,302`, etc. |
| `bg-gray-700` | `#374151` | Input background; session list item; secondary button | Multiple files |
| `bg-gray-600` | `#4b5563` | Inline-edit input background; secondary button hover | `app/dashboard/page.js:327,368` |
| `bg-teal-600` | `#0d9488` | Primary CTA button default | `app/page.js:12`, `app/login/page.js:63`, etc. |
| `bg-teal-500` | `#14b8a6` | Primary CTA button hover | All primary button `hover:` states |
| `bg-teal-900` | `#134e4a` | Calendar cell: 1–30 min | `app/calendar/page.js:13` |
| `bg-teal-800` | `#115e59` | Calendar cell: 31–60 min | `app/calendar/page.js:14` |
| `bg-teal-400` | `#2dd4bf` | Calendar cell: 3h+ | `app/calendar/page.js:17` |

⚠️ **System risk:** Background colors are hardcoded as Tailwind utility classes scattered across every page file. There is no design token abstraction layer (no CSS variable aliases like `--color-surface`). A palette change requires editing every file.

### Text Colors

| Token (class) | Usage | Source |
|---|---|---|
| `text-white` | Primary content text; stat values; button labels | Dashboard, Calendar |
| `text-gray-400` | Secondary/body text; empty states; placeholder |  All pages |
| `text-gray-300` | Form labels | Login, Signup, Dashboard |
| `text-gray-500` | Tertiary / metadata text (session date stamp) | `app/dashboard/page.js:387` |
| `text-gray-700` | 404 page large number | `app/not-found.js:6` |
| `text-amber-400` | Page/app title (h1 headings on all screens) | `app/page.js:6`, `app/login/page.js:33`, etc. |
| `text-teal-400` | Hyperlinks; calendar legend swatches; sign-in/up links | Multiple files |
| `text-teal-300` | Calendar cell text: 1–30 min | `app/calendar/page.js:13` |
| `text-teal-200` | Calendar cell text: 31–60 min | `app/calendar/page.js:14` |
| `text-red-400` | Error messages | All pages with forms |
| `text-green-400` | Success messages (signup, forgot-password) | `app/signup/page.js:66`, `app/forgot-password/page.js:52` |
| `text-orange-400` | Streak warning ("Play today to keep it!") | `app/dashboard/page.js:227` |
| `text-gray-900` | Calendar cell text: 3h+ (on light teal bg) | `app/calendar/page.js:17` |

⚠️ **System risk:** Two separate semantic feedback colors for "calendar cell text" exist (teal-300, teal-200, white, gray-900) that are purely positional — they're not named by intent.

### Borders

| Token (class) | Usage | Source |
|---|---|---|
| `border-gray-700` | Card borders | All card containers |
| `border-gray-600` | Input borders; session list item borders | Dashboard, auth pages |
| `border-gray-500` | Inline-edit input borders (darker context) | `app/dashboard/page.js:327` |
| `border-teal-600` | Signup page secondary CTA button border | `app/page.js:18` |

---

## Typography

⚠️ **System risk:** Typography is not systematized. Font sizes, weights, and line heights are applied ad-hoc with Tailwind classes at each usage site.

### Font Families

| Variable | Family | Applied to | Source |
|---|---|---|---|
| `--font-geist-sans` | Geist Sans | `<html>` element (className) | `app/layout.js:20` |
| `--font-geist-mono` | Geist Mono | `<html>` element (className) | `app/layout.js:20` |
| body fallback | Arial, Helvetica, sans-serif | `body` in globals.css | `app/globals.css:6` |

[Inference] Geist Sans is the primary reading font; Geist Mono is available but no component explicitly uses `font-mono`.

### Type Scale (in use)

| Scale | Classes | Usage |
|---|---|---|
| Display | `text-6xl font-bold` | 404 error page number | `app/not-found.js:6` |
| H1 — Landing | `text-4xl font-bold` | Landing page app title | `app/page.js:6` |
| H1 — App | `text-2xl font-bold` | Dashboard & Calendar header; auth form titles | All main pages |
| H2 — Section | `text-lg font-semibold` | "Log a Session", "Today's Sessions", calendar month name | Dashboard, Calendar |
| Stat value | `text-xl font-bold` | Numbers in stat cards | `app/dashboard/page.js:213,218,...` |
| Body | `text-sm` | Labels, error messages, links, session notes | All form pages |
| Caption / meta | `text-xs` | Stat card labels; day-of-week headers; session date stamp | Dashboard, Calendar |
| Micro | `text-[10px]` | Time sub-label inside small calendar cells | `app/calendar/page.js:163` |

---

## Spacing Scale

No custom spacing scale. Tailwind v4 default scale applies. Values actually used:

| Token | Usage |
|---|---|
| `p-8` | Page-level padding; auth card padding |
| `p-6` | Card internal padding (dashboard sections) |
| `p-4` | Stat card padding; session list item padding |
| `p-3` | Calendar selected-date session list item padding |
| `px-6 py-2` | Large button (error/404 pages) |
| `px-3 py-2` | Form input padding |
| `px-3 py-1` | Small button (nav: Calendar, Log out, Dashboard) |
| `px-2 py-1` | Inline-edit input/button padding |
| `mb-8` | Header-to-content spacing |
| `mb-6` | Section-to-section spacing |
| `mb-4` | Title-to-form or title-to-list spacing |
| `mb-2` | Heading sub-spacing |
| `mb-1` | Label-to-input spacing |
| `gap-4` | Form field vertical gap; stat grid gap |
| `gap-3` | Session list gap |
| `gap-2` | Button pair gap (edit/cancel, edit/delete) |
| `gap-1` | Calendar cell gap; legend item gap |

⚠️ **System risk:** Spacing is entirely ad-hoc inline. The same "card inner padding" appears as `p-6` in most places but `p-8` in auth cards and `p-4` in stat cards, with no named token.

---

## Border Radius

| Token | Usage |
|---|---|
| `rounded-xl` | All card/panel containers |
| `rounded-lg` | Primary buttons; form inputs; session list items; small nav buttons; calendar cells |
| `rounded` | Inline-edit inputs; calendar legend swatches |

⚠️ **System risk:** Two different radii for "input" — `rounded-lg` in main forms vs `rounded` in inline edit forms.

---

## Shadows

| Token | Usage |
|---|---|
| `shadow-lg` | All card containers |

No custom shadows. No `shadow-sm` or `shadow-xl` in use.

---

## Focus States

All focusable form inputs share an identical pattern:

```
focus:outline-none focus:ring-2 focus:ring-teal-500
```

Applied to: all `<input>` and `<textarea>` elements across all pages. Source: `app/login/page.js:45`, `app/dashboard/page.js:257`, `app/calendar/page.js` (N/A — no inputs).

No custom focus ring on buttons (rely on browser default `outline`).

⚠️ **System risk:** Button focus states are not explicitly styled — keyboard users get the browser default outline only.

---

## Interactive States

| State | Pattern |
|---|---|
| Button primary hover | `hover:bg-teal-500` (from `bg-teal-600`) |
| Button secondary hover | `hover:bg-gray-600` (from `bg-gray-700`) |
| Button disabled | `disabled:opacity-50` |
| Link hover | `hover:underline` |
| Calendar cell hover | `hover:opacity-75` + `transition-opacity` |
| Nav button hover | `hover:bg-gray-700` (calendar prev/next); `hover:text-white` |

---

## Component Primitives (as implemented)

### Card

```
bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6
```
Variation: auth cards use `p-8`, stat cards use `p-4 text-center`.

### Primary Button

```
bg-teal-600 text-white rounded-lg py-2 font-medium hover:bg-teal-500 disabled:opacity-50
```

### Secondary / Nav Button

```
text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-lg
```

### Text Input / Textarea

```
w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2
focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400
```
Inline-edit variant: `bg-gray-600 border-gray-500 rounded` (no `rounded-lg`).

### Error Message

```
<p className="text-red-400 text-sm">{message}</p>
```

### Success Message

```
<p className="text-green-400 text-sm">{message}</p>
```

### Stat Card

```
bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 text-center
  <p className="text-xs text-gray-400 mb-1">{label}</p>
  <p className="text-xl font-bold text-white">{value}</p>
```

### Session List Item

```
border border-gray-600 rounded-lg p-4 flex justify-between items-start bg-gray-700
```

### Calendar Cell

```
aspect-square rounded-lg flex flex-col items-center justify-center text-xs cursor-pointer
transition-opacity hover:opacity-75 {intensityClass}
[today: ring-2 ring-teal-400 font-bold]
[selected: ring-2 ring-teal-600 ring-offset-1 ring-offset-gray-800]
```

---

## Calendar Heat Map — Intensity Scale

| Minutes | Background | Text | Label |
|---|---|---|---|
| 0 | `bg-gray-700` | `text-gray-500` | None |
| 1–30 | `bg-teal-900` | `text-teal-300` | 1–30m |
| 31–60 | `bg-teal-800` | `text-teal-200` | 31–60m |
| 61–120 | `bg-teal-600` | `text-white` | 1–2h |
| 121–180 | `bg-teal-500` | `text-white` | 2–3h |
| 181+ | `bg-teal-400` | `text-gray-900` | 3h+ |

Source: `app/calendar/page.js:12-17`
