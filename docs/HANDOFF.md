# Handoff: start here

**Current state:** Phases 1–4 are done (shell; domain/DB/backup/seed; Orders; Expenses & Ads). **Next: Phase 5, Dashboard & goals** (`docs/PLAN.md` → Phase 5). Home (`features/dashboard/DashboardScreen.tsx`) is still the Phase 1 placeholder.

## How to work
- `npm run check`: typecheck + lint + test + build. Must pass before committing.
- Preview: `npm run build && (npx vite preview --port 4173 --strictPort > /tmp/kp-preview.log 2>&1 &)`, then:
  - `npm run e2e` (~20 s, 17 flows): extend `scripts/e2e.mjs` with a "Dashboard" section. Helpers: `step`, `clickText(label, scope)`, `clickButtonExact`, `typeInto(label, value)`, `setDate(label, iso)`, `fieldValue`, `waitText` (NBSP-normalised), `settled`, `noDialog`, `isoOffset(days)`, `lastMonthIso()`.
  - `node scripts/shots.mjs --seed http://localhost:4173/ <dir> dashboard "dashboard:click=<css>"`: iPhone/iPad × light/dark screenshots + console/overflow/offline/IndexedDB checks. `--seed` adds demo data through Settings.
  - Stop the preview: `pkill -f "vite preview --port 4173"`.
- Finish the phase: append to `docs/CHANGELOG.md`, rewrite this file, then `git commit`.
- Gotchas: use ` ` escapes, never literal NBSP characters. No `Date.now()` in render (use `useToday()`). No `autoFocus` in sheets. Tailwind classes must be static strings (use maps such as `categoryFill`). Avoid `$$` in bash heredocs (it trips a safety check). macOS has no `timeout` command.

## Building blocks for Phase 5
- Data: `useDataset()` (`@/db/hooks`) → `{orders, expenses, ads}` or `undefined` while loading; `useGoals()`; `goalsRepo.set(type, targetMinor?)` / `remove(type)` (one goal per type; id === type).
- Logic (`@/lib/stats`): `filterDataset(d, periodRange(p, now))`, `summarize(d)` → `{orderCount, received, pending, avgOrderValue|null, expenses, ads, costs, net}`, `breakEven({received, costs, avgOrderValue})` → `{reached, progress 0..1, remaining, ordersNeeded|null}` (use all-time data), `goalProgress(current, target)`, `incomeCostSeries(d, range, now)` → `[{key, income, costs, net}]` (days for a month capped at today, months for all time), `dueSoon(orders, now, 3)` → `{overdue, soon}` of `{order, days}`.
- Dates: `PERIODS`, `periodRange`, `formatDate`, `formatMonth`, `parseISODate`. Money: `useMoney()` (`money(minor, {compact: true})` for chart axes).
- UI: `StatCard` (label, value, hint, icon, tone, onClick), `ProgressBar` (value 0..1, tone), `SegmentedControl`, `Chip`, `Card`, `EmptyState`, `Skeleton`. `DueBadge` (`features/orders/DueBadge.tsx`) for the due strip; open an order with `useUI().openSheet({kind:'order', id})`.
- Charts: Recharts 3 is installed and not used yet. Theme it through CSS variables (`var(--mint)`, `var(--peach)`, `var(--ink-muted)`, `var(--border)`); `ResponsiveContainer` needs a parent with a fixed height.

## Phase 5 checklist
1. i18n `dashboard.*`: periods (this month / last month / all time), stat labels (orders, received, pending, average, expenses, ads, net), chart legend, break-even texts ("ещё N заказов по {avg}", reached 🎉, no orders yet), goal texts (set/edit/remove monthly income goal, progress), due strip (overdue/today/soon, "nothing urgent").
2. A period switcher kept in the `useUI` store (add `period: Period`, default `this_month`).
3. StatCards grid (2 columns on phone, 4 on iPad landscape/desktop); net coloured by sign; pending tapping opens Orders filtered `payment: ['unpaid','half']` via `useOrdersUI().setFilter` + `setTab('orders')`.
4. Income-vs-costs chart (bars or area, two series) with a themed tooltip, compact money axis, day/month labels; empty state when the series is empty.
5. Break-even card (all-time): ProgressBar + "N more orders at your average {avg}". Monthly income goal card: progress for this month's received; edit sheet with an amount (`parseMoney`), remove.
6. Due soon / overdue horizontal strip (chips/cards → open order); hidden when empty.
7. Skeletons while `useDataset()` is undefined; an empty state with a CTA (new order + "try demo data" → Settings) when there's no data at all.
8. e2e: seed demo → dashboard numbers render; set a goal → progress shown; due strip opens an order. Shots on iPhone/iPad, light/dark.
