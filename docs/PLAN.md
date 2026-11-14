# KyialPrint — Implementation Plan

Source spec: `initial_prompt.md` (read it once; this file plus `docs/HANDOFF.md` is enough to continue).

Every phase is sized for one ~5-hour session. It ends with: typecheck + lint + tests + production build all green, a git commit, a new entry in `docs/CHANGELOG.md`, and an updated `docs/HANDOFF.md`, so the next session can start from just those files.

## Decisions (already made, don't reopen them)

| Topic | Decision | Why |
|---|---|---|
| Stack | React 19 + TS + Vite 8, vite-plugin-pwa, Dexie 4, Tailwind v4 (`@tailwindcss/vite`), Framer Motion, Recharts 3, Zustand 5, date-fns 4, Vitest | What the spec asks for |
| Extra deps | `lucide-react` (icons), `@fontsource-variable/nunito` (self-hosted rounded font, works offline), `dexie-react-hooks` (`useLiveQuery`), `fake-indexeddb` (dev, repo tests) | Small and offline-safe |
| Routing | No router. A Zustand `ui` store holds the active tab and open sheets; the tab is mirrored to `location.hash` so it survives a reload | 4 tabs, nothing more needed; avoids standalone-PWA routing problems |
| Money | Stored as **integer minor units** (tyiyn, 1 som = 100). Helpers live in `lib/money.ts` (`toMinor`, `fromMinor`, `formatMoney`, `percentOf`, `sum`). The UI parses decimal input with `,` or `.` | No float drift |
| Dates | `createdAt`/`updatedAt` = epoch ms. `dueDate` and expense/ad `date` = local `YYYY-MM-DD` strings (date-only, no timezone bugs). Helpers live in `lib/dates.ts` | Easy to index, sort and compare |
| IDs | `crypto.randomUUID()` | Lets backup merge work without ID collisions |
| i18n | Small custom typed dictionary. `ru.ts` is the source of truth; `en.ts` must satisfy `typeof ru` (missing keys fail the typecheck). Exposed as `t('orders.title')` plus `Intl` for numbers and dates. No hard-coded UI strings | No dependency, type-safe |
| Settings storage | A Dexie `settings` key-value table (language, currency, theme, pinHash, demoSeeded, goals live in the `goals` table) | Gets backed up along with the data |
| Theme | `system` / `light` / `dark`. Sets `data-theme` on `<html>`. CSS variables are tokens; Tailwind reads them via `@theme` | One palette, both modes |
| PIN | 4–6 digits. Stored as a salted SHA-256 hash (WebCrypto). Lock screen shown on start and when the tab becomes visible again after more than 1 minute. Can be turned off | Privacy, not real security (documented) |
| Demo data | Every seeded row has `demo: true`; "Remove demo data" deletes only those rows | Removable, clearly labelled |
| Backup | JSON `{app:"kyialprint", schemaVersion, exportedAt, data:{orders,expenses,ads,goals,settings}}`. Export uses `navigator.share({files})` when available, otherwise a download. Import is validated with hand-written type guards and offers **merge** (upsert by id, newer `updatedAt` wins) or **replace** | Round-trips without loss |
| Break-even | `net = received − expenses − ads`. When `net < 0`: progress = received / (expenses + ads), and `ordersToBreakEven = ceil(−net / avgOrderValue)` (null when there are no orders yet). | Spec |
| Pending | Σ max(price − amountReceived, 0) over orders that aren't fully paid | Spec |
| Period | `this_month` / `last_month` / `all_time`. Orders are filtered by `createdAt`, expenses and ads by `date` | Spec |

## Data model (TypeScript, `src/db/types.ts`)
```ts
type Product = 'colouring_book' | 'velcro_book' | 'other'
type PaymentStatus = 'paid' | 'half' | 'unpaid'
type WorkStatus = 'new' | 'in_progress' | 'ready' | 'delivered'
type Source = 'instagram' | 'telegram' | 'friend' | 'other'
interface Order { id; childName; product; topic; price /*minor*/; phone?; dueDate? /*YYYY-MM-DD*/;
  extraPages /*int*/; gift; paymentStatus; amountReceived /*minor*/; workStatus; source?; notes?;
  createdAt; updatedAt; demo?: boolean }
type ExpenseCategory = 'paper' | 'printing' | 'velcro_felt' | 'packaging' | 'other'
interface Expense { id; title; price; date; qty?; unit?; category; createdAt; updatedAt; demo? }
interface Ad { id; title; channel; cost; date; notes?; createdAt; updatedAt; demo? }
interface Goal { id; type: 'break_even' | 'monthly_income'; targetAmount?; period: 'all_time' | 'monthly'; updatedAt }
interface SettingRow { key: string; value: unknown }
```
Dexie v1 indexes: `orders: id, createdAt, dueDate, paymentStatus, workStatus, product`, `expenses: id, date, category`, `ads: id, date`, `goals: id, type`, `settings: key`.

## Target structure
```
public/ icons (192, 512, maskable-512, apple-touch-icon-180, favicon.svg)
src/
  db/        schema.ts, types.ts, repositories/{orders,expenses,ads,goals,settings}.ts, backup.ts, seed.ts
  lib/       money.ts, dates.ts, stats.ts, defaults.ts, validation.ts, i18n/{index.ts,ru.ts,en.ts}
  features/  dashboard/, orders/, expenses/, settings/, lock/
  components/ BottomNav, Fab, Sheet, Chip, StatCard, SegmentedControl, EmptyState, Skeleton,
             Field/Input/Select, ConfirmDialog, Toast(undo), ProgressBar, AppShell
  store/     ui.ts (Zustand: tab, sheets, toasts)
  App.tsx, main.tsx, index.css (tokens + Tailwind)
```

## Phases

### Phase 1: Scaffold, PWA, design system, app shell (milestone a)
- git init, Vite React-TS, Tailwind v4, ESLint (flat config, typescript-eslint, react-hooks), Vitest, scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `check` (all four).
- vite-plugin-pwa: `registerType: 'autoUpdate'`, precache everything, manifest (name, short_name, theme/bg colours, standalone, portrait, icons including maskable). Generate PNG icons from an SVG. iOS meta tags: apple-touch-icon, `apple-mobile-web-app-capable`, status-bar style, `viewport-fit=cover`.
- Design tokens (cream, peach, mint, lavender, ink; dark variants), Nunito, radii, soft shadows, safe-area utilities.
- i18n core (`t`, language store, ru/en dictionaries with the shell strings).
- Components: AppShell, BottomNav (4 tabs; on iPad ≥768px it becomes a side rail), Fab, Sheet (Framer Motion bottom sheet with drag-to-close; a centred dialog on wide screens), Chip, StatCard, SegmentedControl, EmptyState, Skeleton, Button, Field inputs, Toast with an undo slot, ConfirmDialog.
- Theme switching (system, light, dark). Placeholder screens for the 4 tabs.
- **Done when:** the app installs and runs offline from `vite preview`, and the shell looks right at 390×844 and 820×1180 in both themes.

### Phase 2: Domain logic, DB, repositories, tests (milestone b)
- `lib/money.ts`, `lib/dates.ts`, `lib/defaults.ts` (order defaults: due date = created + 2 days, gift "Sticker" (localised default label), amountReceived rule per payment status), `lib/stats.ts` (period filter, received, pending, average, expenses, ads, net, break-even, monthly series for the chart, due-soon/overdue, per-category monthly totals, unit cost), `lib/validation.ts` (order/expense/ad form validation returning i18n keys).
- Dexie schema + repositories (CRUD, `useLiveQuery` hooks, soft-delete-free undo: keep the deleted row in memory and re-insert it).
- `db/backup.ts` (serialize, validate, merge/replace) + `db/seed.ts` (demo data, removable).
- Vitest: full coverage of `lib/*` and backup round-trip (with fake-indexeddb).
- **Done when:** all tests are green and the UI is unchanged.

### Phase 3: Orders (milestone c)
- Orders list: cards with child, product chip, topic, price, payment/work badges, due badge (soon/overdue).
- Search (name/topic), filter sheet (payment, work, product, due range), sort (created, due, price), with the filter state kept in Zustand.
- Quick actions: tap the payment badge to cycle paid/half/unpaid (half opens an amount prompt pre-filled with 50%), and a button that advances work status.
- Order form sheet: smart defaults, inputmode tel/decimal, inline validation, edit mode, delete with confirm + undo toast.
- FAB on the Orders tab opens a new order.

### Phase 4: Expenses and Ads (milestone d)
- SegmentedControl Expenses / Ads. Lists grouped by month (sticky month headers with the month total).
- Expense form (title, price, date ≤ today allowed, qty, unit with suggestions, category); unit cost shown live and on cards.
- Monthly totals per category (chips/bars at the top of each month group).
- Ad form (title, channel, cost, date, notes). Edit, delete, undo. FAB is context-aware.

### Phase 5: Dashboard and goals (milestone e)
- Period switcher; StatCards (orders, received, pending, avg, expenses, ads, net with a colour for the sign).
- Recharts income-vs-costs chart (by month for all-time, by week/day for one month), themed through CSS variables.
- Break-even card (progress bar + "N more orders at {avg}"); goal editing for monthly income + progress.
- Due soon/overdue horizontal strip that opens the order. Skeletons while the live query loads, plus an empty state with a CTA.

### Phase 6: Settings, backup, PIN, polish, docs (milestone f)
- Settings: language, currency (code + symbol; formatting through `Intl`), theme, goals, backup export/import (merge/replace dialog with counts), PIN set/change/disable + lock screen, demo data seed/remove, iOS install instructions (detect standalone/iOS).
- Finish both dictionaries (en), polish microcopy, motion (reduced-motion respected), a11y labels.
- Verification: mobile viewports, offline production build, Lighthouse PWA/installability, no console errors, light/dark consistency.
- README (run, build, deploy to Cloudflare Pages and GitHub Pages with a `base` note, iOS install), final summary + known limitations.

## Per-phase checklist
1. Read `docs/HANDOFF.md` (and this file only if needed).
2. Implement the phase scope.
3. `npm run check` (typecheck, lint, test, build) must pass.
4. Append to `docs/CHANGELOG.md`, rewrite `docs/HANDOFF.md` (current state, key files and APIs, next steps).
5. `git commit -m "<milestone>: ..."`.
