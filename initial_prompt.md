# KyialPrint: build prompt

You are a senior mobile-first web engineer and UI designer. Build **KyialPrint** from scratch: a local, offline-first order and expense tracker for a one-person home business that makes personalised colouring books and Velcro ("липучка") play books. It is used on iPhone and iPad (Safari, installed to the home screen) and must also work on desktop browsers.

## Goal and constraints
- A **PWA**: no App Store, no backend, no accounts. All data stays on the device in IndexedDB.
- Works fully offline after first load. Installable via "Add to Home Screen" (manifest, icons, apple-touch-icon, standalone display, safe-area insets).
- Beautiful, friendly, children's-craft-brand feel: warm pastels (peach, mint, lavender) on cream, rounded cards, rounded typeface, soft shadows, gentle motion, dark mode. Mobile-first with a bottom tab bar and a floating "+" button. Touch targets at least 44px. Must look good on iPhone and iPad (use the extra width on iPad).
- UI language: Russian by default with an English switch (i18n from day one, no hard-coded strings). Currency: KGS (som), configurable in Settings.

## Stack (do not substitute without a reason)
React + TypeScript + Vite, vite-plugin-pwa, Dexie (IndexedDB), Tailwind CSS, Framer Motion, Recharts, Zustand (UI state only), date-fns, Vitest for unit tests of pure logic.

## Data model
**Order:** id, childName, product (colouring_book | velcro_book | other), topic, price, phone?, dueDate? (default createdAt + 2 days, editable, clearable), extraPages (int, default 0), gift (default "Sticker"), paymentStatus (paid | half | unpaid), amountReceived (number; default 0 when unpaid, 50% of price when half, full price when paid; editable), workStatus (new | in_progress | ready | delivered), source? (instagram | telegram | friend | other), notes?, createdAt, updatedAt.
**Expense:** id, title, price, date (default now, editable to earlier dates), qty?, unit? (sheets, strings, pcs...), category (paper | printing | velcro_felt | packaging | other), unit cost derived as price / qty.
**Ad (separate table, not an expense):** id, title, channel, cost, date, notes?.
**Goal:** id, type (break_even | monthly_income), targetAmount?, period.
Keep money as numbers in the smallest sensible unit or use a money helper, and never use floats for sums without rounding.

## Screens and behaviour
1. **Dashboard:** period switcher (this month / last month / all time); cards for total orders, total earnings (money actually received), pending (unpaid remainder), average order value, expenses, ads, and **net = received − expenses − ads**. Income vs costs chart. **Break-even card**: progress from the current negative net to zero, plus "N more orders at your average price to break even". Optional monthly income goal. A "due soon / overdue" strip.
2. **Orders:** list with search (name, topic), filters (payment status, work status, product, due date range), sort. Quick actions: change payment status in one tap (with amount-received prompt for half), advance work status. Edit and delete with confirmation and undo.
3. **Order form** (bottom sheet): the fields above with smart defaults. Validation with inline messages.
4. **Expenses:** list grouped by month with a segmented toggle Expenses / Ads. Add/edit forms. Show unit cost where qty is given and monthly totals per category.
5. **Settings:** language, currency, goals, theme, **backup (export JSON via share sheet / download) and restore (import with validation and merge/replace choice)**, optional PIN lock, "install on home screen" instructions for iOS.
- Empty states, skeletons, and friendly microcopy everywhere. Keyboard types matched to fields (tel, decimal). No hover-only interactions.

## Suggested structure
```
kyialprint/
├─ public/ (icons, manifest assets)
├─ src/
│  ├─ db/ (schema.ts, repositories for orders, expenses, ads, goals)
│  ├─ features/{dashboard,orders,expenses,settings}/
│  ├─ components/ (BottomNav, Sheet, Chip, StatCard, ...)
│  ├─ lib/ (money.ts, dates.ts, stats.ts, i18n/)
│  ├─ App.tsx, main.tsx
├─ vite.config.ts
└─ README.md
```
Put all business calculations (earnings, net, average, break-even, defaults) in pure functions in `lib/` with unit tests.

## Process
1. **Plan first:** reply with a short plan and any blocking questions, then proceed without waiting if none.
2. Work in milestones and commit after each with a clear message: (a) scaffold + PWA + design system, (b) DB + repositories + tests, (c) orders, (d) expenses and ads, (e) dashboard and goals, (f) settings, backup, i18n, polish.
3. After each milestone run typecheck, lint, tests and a production build; fix everything before moving on.
4. Test in a mobile viewport (iPhone and iPad sizes) and check offline behaviour with the production build.
5. Seed a demo-data option in Settings (clearly labelled, removable) so the dashboard can be reviewed.

## Deliverables and acceptance
- Working app plus a README covering: run locally, build, deploy to a free static host (Cloudflare Pages or GitHub Pages), and install on iPhone/iPad (Safari → Share → Add to Home Screen).
- Acceptance: all features above work offline; backup/restore round-trips without data loss; no console errors; Lighthouse PWA checks pass; the UI is consistent in light and dark mode.
- Finish with a short summary: what was built, how to deploy it, and known limitations (no cross-device sync; iOS web apps cannot send reliable push notifications).