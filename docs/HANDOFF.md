# Handoff: start here

**Current state:** Phase 1 is done (scaffold, PWA, design system, shell). **Next: Phase 2, domain logic + DB + tests** (see `docs/PLAN.md` → Phases → Phase 2 and the Decisions table).

## How to work
- `npm run check`: typecheck + lint + test + build (must be green before committing).
- Visual/offline smoke test: `npm run build && npx vite preview --port 4173 &` then `npm run shots` (writes `shots/`, gitignored). Pass routes like `orders:fab` to open the FAB sheet. Uses local Google Chrome via puppeteer-core (`CHROME=` env to override).
- Commit per phase: `git commit -m "<phase>: ..."`, then update `docs/CHANGELOG.md` and this file.

## Key files and APIs
- `src/index.css`: tokens. Use Tailwind colour names: `bg-surface`, `text-muted`, `bg-peach-soft text-peach`, etc. Tones for components: `src/components/tone.ts` (`peach|mint|lavender|sun|danger|neutral`).
- `src/lib/i18n/{ru,en,index}.ts`: add every string to **both** files (test + typecheck enforce it). Plurals: `key_one/_few/_many/_other`, `tp('orders.count', n)`.
- `src/hooks/useT.ts` → `const { t, tp, lang } = useT()`; `src/hooks/useMedia.ts` → `useIsWide()` (≥768px).
- `src/store/ui.ts`: `useUI` (tab, `sheet: {kind:'order'|'expense'|'ad', id?}`, `openSheet`, `closeSheet`, `expensesView`), `toast({message, actionLabel?, onAction?})`, `await confirmDialog({title, body?, confirmLabel?, danger?})`.
- `src/store/prefs.ts`: `usePrefs` → `{lang, theme, currency, currencySymbol, set(patch)}`.
- Components (`src/components/`): `Page` (title/subtitle/actions) + `Card`, `Sheet` (open, onClose, title, footer, size), `Field` (render-prop `(id, describedBy, invalid) => control`), `TextInput`/`SelectInput`/`TextArea`, `Button` (variant primary|secondary|ghost|danger, size md|sm|icon), `Chip` (badge or toggle with onClick/selected), `StatCard`, `SegmentedControl`, `EmptyState`, `Skeleton(List)`, `ProgressBar` (0..1), `Fab`.
- `src/App.tsx`: tab switch + context-aware FAB (currently opens `{kind:'demo'}`; Phases 3/4 swap in the real sheets).

## Phase 2 checklist (next)
1. `src/db/types.ts` (types per PLAN Data model), `src/db/schema.ts` (Dexie `KyialDB`, v1 indexes from PLAN).
2. `src/lib/money.ts`, `dates.ts`, `defaults.ts`, `stats.ts`, `validation.ts` (pure, fully unit-tested).
3. Repositories in `src/db/repositories/*` + live hooks (`dexie-react-hooks` `useLiveQuery`); settings repo syncing `usePrefs` ↔ Dexie `settings`.
4. `src/db/backup.ts` (export/validate/merge/replace) + `src/db/seed.ts` (demo rows flagged `demo: true`) with round-trip tests.
