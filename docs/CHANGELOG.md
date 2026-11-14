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
