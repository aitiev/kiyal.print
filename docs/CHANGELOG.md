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
