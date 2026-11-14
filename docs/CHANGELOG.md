# Changelog

## Phase 1: Scaffold, PWA, design system, app shell (2026-11-14)
**Added**
- Vite 8 + React 19 + TS 6.0 (pinned `~6.0`: typescript-eslint doesn't support TS 7 yet), Tailwind v4 via `@tailwindcss/vite`, ESLint 10 flat config, Vitest 5 (+ `fake-indexeddb` setup).
- Scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `check` (all four), `icons` (regenerate PNG icons from `scripts/logo.mjs`), `shots` (puppeteer-core smoke test: iPhone/iPad × light/dark screenshots, console-error + horizontal-overflow check, offline reload check).
- PWA: vite-plugin-pwa `generateSW`, autoUpdate, precaches all assets including the self-hosted Nunito font; manifest with 192/512/maskable icons; iOS meta (apple-touch-icon, standalone, `viewport-fit=cover`). `BASE` env var for GitHub Pages sub-paths.
- Design tokens as CSS variables (light + dark) mapped to Tailwind colours: `bg surface surface-2 line ink muted peach mint lavender sun danger` (+ `-soft`), `on-accent`, `rounded-card`, `shadow-soft/lift`; safe-area utilities `pt-safe pb-safe pl-safe pr-safe`, `tabular`, `no-scrollbar`. Reduced-motion respected.
- i18n: typed dictionaries (`ru.ts` source of truth, `en.ts: Messages`), `translate`/`translatePlural` (Intl.PluralRules), `useT()` hook → `{ t, tp, lang }`.
- Stores: `usePrefs` (lang/theme/currency, localStorage boot cache `kp.prefs`), `useUI` (tab mirrored to `#/tab`, expensesView, sheet, toasts, confirm) + helpers `toast()`, `dismissToast()`, `confirmDialog()`.
- Components: Button, Chip, StatCard, SegmentedControl, EmptyState, Skeleton/SkeletonList, ProgressBar, Field/TextInput/SelectInput/TextArea, Sheet (bottom sheet ↔ centred dialog), ConfirmHost, Toaster (undo action), BottomNav (bottom bar ↔ iPad side rail with logo), Fab, Page/Card.
- Placeholder screens for the 4 tabs; Settings language + theme work. `features/DemoSheet.tsx` previews form styling (to delete in Phase 3).

**Verified:** typecheck, lint, 3 tests, build; screenshots at 390×844 and 820×1180 in light/dark; no console errors; offline reload served by the service worker.

**Notes**
- Base CSS lives in `@layer base`. Unlayered rules override Tailwind utilities, so don't put resets outside a layer.
- Flaky npm network: if the build complains about `@rollup/rollup-darwin-*`, run `npm i --no-save @rollup/rollup-darwin-arm64@<rollup version>` (npm optional-deps bug).

## Phase 2: Domain logic, DB, repositories, backup, seed (2026-11-14)
**Added**
- `src/db/types.ts`: domain types plus `PRODUCTS`, `PAYMENT_STATUSES` (`unpaid, half, paid`), `WORK_STATUSES`, `SOURCES`, `EXPENSE_CATEGORIES`, `GOAL_TYPES` const arrays; `OrderInput/ExpenseInput/AdInput` (= editable fields, no meta).
- `src/db/schema.ts`: Dexie `KyialDB` v1 (`orders, expenses, ads, goals, settings`), singleton `db`, `newId()`.
- Repositories (`src/db/repositories/*`, re-exported from `src/db/index.ts`): `ordersRepo` (list/get/create/update/setPayment/advanceWork/remove/restore), `expensesRepo`, `adsRepo` (list/get/create/update/remove/restore), `goalsRepo` (list/get/set/remove; id === type), `settingsRepo` (get/set/remove; keys `prefs | pinHash | lockTimeoutMin`). Undefined fields are stripped before storing.
- Live hooks `src/db/hooks.ts`: `useOrders, useOrder(id), useExpenses, useExpense(id), useAds, useAd(id), useGoals, useDataset` (all return `undefined` while loading).
- `src/db/prefsSync.ts`: `initPrefsSync()` (called in `main.tsx`) mirrors `usePrefs` ↔ Dexie `settings.prefs`; `loadPrefsFromDb()` (call after a restore).
- `src/db/backup.ts`: `exportBackup`, `serializeBackup`, `backupFileName`, `validateBackup` (strict per-field type guards; returns `{code: not_json|not_backup|newer_version|invalid_row, table, index, field}`; drops unknown fields; missing tables OK), `restoreBackup(file, 'merge'|'replace')` → per-table `{added, updated, skipped}`. Merge: upsert by id, newer `updatedAt` wins, local settings kept (missing keys added). Replace: wipe everything, then insert.
- `src/db/seed.ts`: `buildDemoData(now, seed)` (deterministic: 21 orders over ~3 months including overdue/today/tomorrow, expenses, 3 ads, all `demo: true`), `seedDemoData`, `hasDemoData`, `removeDemoData`.
- `src/lib/money.ts`: `toMinor, fromMinor, sumMinor, percentOf, divideMinor, parseMoney ("1 200,50"), parseDecimal, formatMoney(minor, {lang, currency, symbol}, {compact}), toInputString`.
- `src/lib/dates.ts`: `ISODate`, `Period` + `PERIODS`, `toISODate, parseISODate, isValidISODate, todayISO, addDaysISO, daysUntil, monthKey, periodRange → DateRange{from,to}, inRange, msInRange, monthKeysBetween, daysBetween, formatDate, formatMonth`.
- `src/lib/defaults.ts`: `defaultDueDate (+2d), defaultAmountReceived, newOrderDraft(now, giftLabel), newExpenseDraft, newAdDraft, nextWorkStatus, nextPaymentStatus, paymentStatusFor`.
- `src/lib/stats.ts`: `filterDataset, receivedTotal, pendingTotal, averageOrderValue, summarize → Summary, breakEven, goalProgress, incomeCostSeries (days for a month capped at today, months for all time), dueSoon, dueState, unitCost, categoryTotals, groupByMonth`.
- `src/lib/orderQuery.ts`: `OrderFilter/EMPTY_FILTER, OrderSort/DEFAULT_SORT, activeFilterCount, matchesFilter (case + ё-insensitive), sortOrders (missing due dates last), queryOrders`.
- `src/lib/validation.ts`: `OrderForm/ExpenseForm/AdForm` (raw strings) + `parseOrderForm/parseExpenseForm/parseAdForm` → `{ok, value} | {ok:false, errors: {field: MsgKey}}`; `isValidPhone`, `LIMITS`. `src/lib/forms.ts`: `orderToForm/expenseToForm/adToForm` (inverse).
- i18n: `validation.*` messages (ru/en).
- `main.tsx` requests `navigator.storage.persist()`.
- Tests: 48 (money, dates, defaults, stats, orderQuery, validation, i18n, repositories, backup round-trip/merge/validation, demo seed). Tests run in a fixed TZ `Asia/Bishkek`. Factories in `src/test/factories.ts`.
- `scripts/shots.mjs` now also checks that `settings.prefs` exists in IndexedDB.

**Decisions:** a "paid" order never counts as pending; income in charts is attributed to the order's `createdAt` (no separate payment date); `amountReceived` is clamped to `[0, price]` in `setPayment`, and the form rejects amount > price. Replace-restore also replaces settings (including PIN).

## Phase 3: Orders (2026-11-14)
**Added**
- `features/orders/`:
  - `OrdersScreen`: sticky search (name/topic, deferred), work-status quick chips with counts, a filter button with an active-count badge, an iPad 2-column grid, skeleton/empty/no-results states, animated list.
  - `OrderCard`: product emoji tile, price, topic, work chip, `DueBadge`. Bottom row: a one-tap payment pill (cycle) and a "next work status" button. Tap the top area to edit.
  - `OrderFormSheet`: create/edit via `useUI().sheet = {kind:'order', id?}`. Smart defaults; changing the status re-defaults the amount until it is edited by hand; on blur the amount re-infers the status. Clearable due date; collapsible "details" section (phone `tel`, extra-pages stepper, gift, source chips, notes). Inline errors with focus on the first invalid field; delete (confirm + undo) in the footer.
  - `OrderFilterSheet`: sort key + direction, payment/work/product multi-select chips, due date range, reset, "Show · N orders".
  - `HalfPaymentSheet`: "how much was received?" prompt (pre-filled 50%, 30/50/70% shortcuts) opened by the quick action unpaid → half; the status is inferred from the amount.
  - `useOrderActions()`: `cyclePayment`, `setReceived`, `advanceWork`, `remove`, all with undo toasts (restore the previous row).
  - `DueBadge`, `meta.ts` (tones/emoji per product, payment and work status).
- `src/store/orders.ts`: `useOrdersUI` (filter, sort, filtersOpen, halfPromptId).
- `src/hooks/useMoney.ts` (`money(minor)`, `money.unit`); `src/hooks/useToday.ts` (render-safe start of today that updates on day change or app resume; use it instead of `Date.now()` in render; required by the React-compiler lint rule `react-hooks/purity`).
- Settings → **Demo data** card (`DemoDataCard`, pulled forward from Phase 6): add/remove, labelled "Демо".
- i18n: `orders.*` (products, statuses, sources, due texts with plurals, form, toasts, a11y), `settings.demo*`.
- `scripts/e2e.mjs` (`npm run e2e`, needs `vite preview` on :4173): 10 orders flows (validation, create with half payment, one-tap payment + undo, advance, unpaid → half prompt, edit, delete + undo, search/reset, persistence). `scripts/shots.mjs`: `--seed` flag and `tab:click=<selector>` actions; each route does a fresh load.

**Changed / fixed**
- Removed `features/DemoSheet.tsx` and the `'demo'` sheet kind. FAB on Home/Orders opens a new order; on Expenses it's hidden until Phase 4.
- `useOrder/useExpense/useAd` return `null` for a missing row (`undefined` = loading).
- `Sheet`: focuses the panel with `preventScroll`, because focusing during the slide-in scrolled the overlay and left the sheet half off-screen; it also tracks `useUI().sheetDepth`. Don't use `autoFocus` inside sheets.
- `Toaster`: moves to the top of the screen while any sheet is open, so it never covers sheet buttons.

## Phase 4: Expenses & Ads (2026-11-14)
**Added**
- `features/expenses/`:
  - `ExpensesScreen`: Expenses/Ads `SegmentedControl` (`useUI().expensesView`), all-time total in the subtitle, lists grouped by month (`groupByMonth`) with sticky month headers + month totals. For expenses, each month has a proportional category bar + per-category total chips (`categoryTotals`). iPad 2-column grid, skeletons, empty states with CTA.
  - `ExpenseCard` / `AdCard`: category emoji tile, title, date · category (or channel), amount, plus a mint line with "qty unit · unit cost / unit" (expenses) or notes (ads). Tap opens edit.
  - `ExpenseFormSheet` (`sheet.kind === 'expense'`): title, amount, date (`max` = today; validation rejects future dates), qty + unit with `<datalist>` suggestions, live unit-cost preview, category chips.
  - `AdFormSheet` (`'ad'`): title, channel (datalist: Instagram/Telegram/WhatsApp/Блогер/Листовки), cost, date (≤ today), notes.
  - `useExpenseActions()`: `removeExpense`, `removeAd` (confirm + undo toast). `meta.ts`: `categoryTone`, `categoryFill` (static Tailwind classes), `categoryEmoji`, `UNIT_KEYS`, `CHANNEL_KEYS`.
- Reusable `components/FormSheet.tsx` (create/edit frame: skeleton while loading, not-found state, Save + Delete footer) and `hooks/useFormState.ts` (`{form, update, err, handleSubmit(onValid), formRef}`: errors after the first submit, then live; focuses the first invalid field). Use both for future simple forms.
- `lib/money.ts`: `formatNumber(n, lang)`.
- i18n `expenses.*` (categories, units, channels, form/adForm, toasts, a11y).
- FAB on Expenses opens a new expense or ad depending on the active segment.
- e2e: an "Expenses & Ads" section with 7 flows (unit cost live + saved, future date rejected, month grouping, edit, ads add/delete/undo, persistence) plus per-step timings. 17 flows in ~20 s.

**Fixed**
- On phones the toast stack sat on top of the FAB, blocking "+" for 3–6 s after every save. Toasts now sit above it (`bottom: 10.75rem + safe area`).
- Russian month headers no longer end with " г." (`formatMonth` → "Ноябрь 2026").
- `scripts/e2e.mjs` now calls `process.exit`, because lingering puppeteer handles kept node alive ~4.5 min after finishing.
- Unit cost is shown as "{price} / {unit}" (free-text units made "за листов" ungrammatical).

## Phase 5: Dashboard & goals (2026-11-15)
**Added**
- `features/dashboard/`:
  - `DashboardScreen`: period switcher (`useUI().period`, default `this_month`; labels from `dashboard.periodShort`), due strip, 7 StatCards (received, pending, orders, average, expenses, ads, net). Net spans two columns and is coloured by sign. Tapping "Pending" resets the order filters, applies `payment: ['unpaid','half']` and opens Orders. Skeletons while `useDataset()` loads; with no data at all, an empty state with "New order" and "Try demo data" (→ Settings).
  - `IncomeChart` (lazy-loaded, so Recharts gets its own ~370 kB chunk that is still precached): income vs costs bars themed with CSS variables, a compact axis without the currency ("1,2 тыс."), a themed tooltip with full money values, a legend, and a text empty state when every bucket is zero.
  - `GoalCards`: `BreakEvenCard` (all-time ProgressBar, "{received} of {costs}", "N more orders at {avg}" / reached 🎉 / no-orders fallback) and `IncomeGoalCard` (this month's received vs the `monthly_income` goal; set/edit/remove through a small sheet; validation: required, number, > 0).
  - `DueStrip`: horizontal scroll-snap cards (overdue first, then due within 3 days) with `DueBadge`; tap opens the order sheet. Hidden when empty.
- `lib/money.ts`: `roundToMajor()` (averages are shown in whole som).
- `Card` accepts `data-testid`.
- i18n `dashboard.*` in ru and en.
- e2e: a dashboard empty-state check plus a "Dashboard" section (seed → stats + chart, period switch, goal set/remove, due strip opens order, pending → filtered Orders). 23 flows in ~30 s.
