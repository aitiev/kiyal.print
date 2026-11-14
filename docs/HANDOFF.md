# Handoff: start here

**Current state:** Phases 1–2 are done (shell + design system; domain logic, DB, repositories, backup, seed, 48 tests). **Next: Phase 3, Orders UI** (`docs/PLAN.md` → Phase 3). The UI still shows Phase 1 placeholders, and the FAB opens `features/DemoSheet.tsx` (delete it in Phase 3).

## How to work
- `npm run check`: typecheck + lint + test + build (must pass before committing).
- Smoke test: `npm run build && (npx vite preview --port 4173 &)` then `npm run shots` (or `node scripts/shots.mjs http://localhost:4173/ <outDir> orders orders:fab`). It checks iPhone/iPad × light/dark screenshots, console errors, horizontal overflow, the IndexedDB prefs row and offline reload. Uses local Chrome via puppeteer-core. Kill the preview afterwards: `pkill -f "vite preview"`.
- Finish the phase: append to `docs/CHANGELOG.md` (it lists every module's API in detail), rewrite this file, and `git commit`.
- Write ` ` escapes, never literal NBSP characters (ESLint `no-irregular-whitespace`).

## Key APIs (details in CHANGELOG, Phase 1 and 2 sections)
- **UI kit** `src/components/`: `Page`/`Card`, `Sheet` (open, onClose, title, footer, size), `Field` (render-prop `(id, describedBy, invalid)`), `TextInput/SelectInput/TextArea`, `Button`, `Chip` (badge, or toggle with onClick/selected; tones in `tone.ts`), `StatCard`, `SegmentedControl`, `EmptyState`, `SkeletonList`, `ProgressBar`, `Fab`.
- **State** `src/store/ui.ts`: `useUI` (tab, `sheet {kind:'order'|'expense'|'ad', id?}`, `openSheet/closeSheet`, `expensesView`), `toast({message, actionLabel, onAction})`, `await confirmDialog({title, body, confirmLabel, danger})`. `src/store/prefs.ts`: `usePrefs` (lang, theme, currency, currencySymbol, set).
- **i18n**: `const { t, tp, lang } = useT()`; add each key to both `ru.ts` and `en.ts`.
- **Data**: `import { ordersRepo, ... } from '@/db'`; hooks in `@/db/hooks` (`useOrders()`, `useOrder(id)`...; `undefined` = loading → show `SkeletonList`).
- **Logic**: `@/lib/validation` (`parseOrderForm`), `@/lib/forms` (`orderToForm`), `@/lib/defaults` (`newOrderDraft(now, t('…gift'))`, `defaultAmountReceived`, `nextWorkStatus`, `nextPaymentStatus`), `@/lib/orderQuery` (`queryOrders`, `EMPTY_FILTER`, `DEFAULT_SORT`, `activeFilterCount`), `@/lib/stats` (`dueState`), `@/lib/money` (`formatMoney(minor, {lang, currency, symbol: currencySymbol})`), `@/lib/dates` (`formatDate`).

## Phase 3 checklist (Orders)
1. i18n labels: products, payment and work statuses, sources, order form field labels/placeholders, the default gift ("Наклейка"/"Sticker"), sort/filter labels, due badges (overdue/today/in N days), and toasts (saved/deleted/undo).
2. A `useMoney()` hook (formatMoney bound to prefs) in `src/hooks/`.
3. Order filter + sort state in Zustand (`src/store/orders.ts`, using `EMPTY_FILTER`/`DEFAULT_SORT`).
4. `features/orders/`: `OrdersScreen` (search field, filter button with badge → filter sheet, sort menu, list of `OrderCard`, empty/skeleton states, a "no results" state with a reset-filters button), `OrderCard` (child, product chip, topic, price, payment chip = one-tap cycle via `nextPaymentStatus`; `half` asks for the amount pre-filled with 50%, work-status advance button, due badge via `dueState`; tap opens edit), `OrderFormSheet` (create/edit from `useUI().sheet`, `orderToForm` ↔ `parseOrderForm`, inline errors, changing the payment status re-defaults the amount, a clear-due-date button, `inputMode` decimal/tel/numeric, delete with `confirmDialog` + undo toast via `ordersRepo.remove/restore`).
5. Wire the FAB in `App.tsx` to `openSheet({kind:'order'})`; remove `DemoSheet`.
6. On iPad use a 2-column card grid. Run the smoke test with `orders` and `orders:fab`.
