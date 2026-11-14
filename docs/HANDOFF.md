# Handoff: start here

**Current state:** Phases 1–3 are done (shell; domain/DB/backup/seed; Orders UI). **Next: Phase 4, Expenses & Ads** (`docs/PLAN.md` → Phase 4). Settings already has the Demo-data card (seed it to review lists).

## How to work
- `npm run check`: typecheck + lint + test + build. Must pass before committing.
- Preview: `npm run build && (npx vite preview --port 4173 --strictPort > /tmp/kp-preview.log 2>&1 &)`, then:
  - `npm run e2e`: UI flows (extend `scripts/e2e.mjs` with an "Expenses" section; helpers: `clickText`, `clickButtonExact`, `typeInto(label, value)`, `fieldValue`, `waitText`, `settled`, `noDialog`).
  - `node scripts/shots.mjs --seed http://localhost:4173/ <dir> expenses expenses:fab "expenses:click=<css>"`: iPhone/iPad × light/dark screenshots + console/overflow/offline checks.
  - Stop the preview with `pkill -f "vite preview --port 4173"`.
- Finish the phase: append to `docs/CHANGELOG.md`, rewrite this file, then `git commit`.
- Gotchas: use ` ` escapes, never literal NBSP characters. No `Date.now()` in render (use `useToday()`). No `autoFocus` in sheets. Avoid `$$` inside bash heredocs (it trips a safety check); edit files with Edit/Write instead.

## Patterns to copy from Orders (Phase 3)
- Sheet form: `features/orders/OrderFormSheet.tsx`. The outer component reads `useUI().sheet`, loads the row with `useExpense(id)` / `useAd(id)` (`undefined` = loading → Skeleton, `null` = not found), renders `<Body key={id ?? 'new'}>`, and has a footer submit button with `form={FORM_ID}` (+ a delete icon button in edit mode). The body keeps raw-string form state (`expenseToForm`/`adToForm` from `@/lib/forms`), validates with `parseExpenseForm/parseAdForm` (`@/lib/validation`), shows `t(errors[k])`, re-validates live after the first submit, and focuses the first `[aria-invalid="true"]`.
- Undo: `const removed = await expensesRepo.remove(id); toast({message, actionLabel: t('common.undo'), onAction: () => void expensesRepo.restore(removed)})` after a `confirmDialog`.
- Money: `const money = useMoney()` → `money(minor)`, `money.unit` for labels. Dates: `formatDate(iso, lang)`, `formatMonth('YYYY-MM', lang)`.
- Lists: `SkeletonList` while `undefined`, `EmptyState` with a CTA, `AnimatePresence mode="popLayout"` + `motion.article layout`.

## Phase 4 checklist (Expenses & Ads)
1. i18n `expenses.*`: categories (`paper, printing, velcro_felt, packaging, other`), form labels (title, price, date, qty, unit + unit suggestions such as листов/шт/м/упаковок), unit-cost text ("{price} за {unit}"), month total, per-category totals, toasts, ad fields (title, channel + suggestions Instagram/Telegram/WhatsApp/Листовки, cost, date, notes), empty states for ads.
2. `ExpensesScreen`: the existing `SegmentedControl` (`useUI().expensesView`), lists grouped with `groupByMonth` (`@/lib/stats`) and sticky month headers showing the month total. For expenses, per-category totals at the top of each month (`categoryTotals`, coloured chips or mini bars). Cards show unit cost via `unitCost()` when qty is set.
3. `ExpenseFormSheet` (`sheet.kind === 'expense'`) and `AdFormSheet` (`'ad'`): date input `max={todayISO()}` (no future dates), `inputMode="decimal"` for price/qty, `<datalist>` for unit/channel suggestions, live unit-cost preview.
4. `App.tsx`: FAB on Expenses → `openSheet({kind: expensesView === 'ads' ? 'ad' : 'expense'})` (the `fab` variable; `expensesView` is already read there). Mount both sheets.
5. Category tones: paper→lavender, printing→peach, velcro_felt→mint, packaging→sun, other→neutral (create `features/expenses/meta.ts`).
6. Extend the e2e flows (add expense with qty → unit cost shown; future date rejected; ad add/edit/delete + undo; month grouping) and take shots.
