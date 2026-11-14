# Handoff: start here

**Current state:** Phases 1–5 are done (shell; domain/DB/backup/seed; Orders; Expenses & Ads; Dashboard & goals). **Next: Phase 6, Settings, backup, PIN, polish, docs** (`docs/PLAN.md` → Phase 6). It is the last phase.

## How to work
- `npm run check`: typecheck + lint + test + build. Must pass before committing.
- Preview: `npm run build && (npx vite preview --port 4173 --strictPort > /tmp/kp-preview.log 2>&1 &)`, then:
  - `npm run e2e` (~30 s, 23 flows): extend `scripts/e2e.mjs` with a "Settings" section. Helpers: `step`, `clickText(label, scope)`, `clickButtonExact`, `typeInto(label, value)`, `setDate(label, iso)`, `fieldValue`, `waitText` (NBSP-normalised), `settled`, `noDialog`, `isoOffset(days)`, `lastMonthIso()`. Toasts (`[role=status]`) can cover buttons near the bottom: wait for them to go before clicking there.
  - `node scripts/shots.mjs --seed http://localhost:4173/ <dir> settings "settings:click=<css>"`: iPhone/iPad × light/dark screenshots + console/overflow/offline/IndexedDB checks.
  - Stop the preview: `pkill -f "vite preview --port 4173"`.
- Finish the phase: append to `docs/CHANGELOG.md`, rewrite this file, then `git commit`.
- Gotchas: use ` ` escapes, never literal NBSP characters. No `Date.now()` in render (use `useToday()`). No `autoFocus` in sheets. Tailwind classes must be static strings. Avoid `$$` in bash heredocs. macOS has no `timeout` command. Scroll-snap rows need `scroll-px-*` matching their padding.

## Building blocks for Phase 6
- Settings screen (`features/settings/SettingsScreen.tsx`) already has language + theme `SegmentedControl`s and `DemoDataCard`. Prefs: `usePrefs()` (`lang`, `theme`, `currency`, `currencySymbol`, `set(patch)`), mirrored to Dexie by `db/prefsSync.ts`.
- Backup (`db/backup.ts`): `exportBackup()`, `serializeBackup()`, `backupFileName()`, `validateBackup(raw)` → `{ok, file}` / `{ok:false, error}`, `restoreBackup(file, 'merge'|'replace')` → per-table `RestoreReport`. Has unit tests; no UI yet.
- PIN: `settingsRepo` keys `pinHash`, `lockTimeoutMin`. No hashing helper or lock screen yet (use Web Crypto SHA-256 + salt).
- Goals: the monthly goal is edited from the dashboard (`IncomeGoalCard`). Settings can reuse it or link there.
- UI kit: `Page`, `Card`, `Sheet` (size `sm` for dialogs), `Button`, `Field`/`TextInput`, `SegmentedControl`, `Chip`, `confirmDialog()`, `toast()`, `FormSheet` + `useFormState` for forms.

## Phase 6 checklist
1. Currency setting (code + optional symbol; preview through `useMoney`).
2. Backup: export (download JSON; share sheet on iOS if `navigator.canShare`), import (file input → validate → merge/replace dialog with counts → report toast). e2e: export → import replace round-trip.
3. PIN: set/change/disable, lock screen on start and after `lockTimeoutMin` in the background; keypad UI. e2e: set PIN → reload → unlock.
4. iOS install instructions (detect iOS Safari and not standalone).
5. Polish: finish en dictionary, `prefers-reduced-motion`, a11y labels, consider splitting the 590 kB main chunk.
6. Verification: offline production build, Lighthouse PWA/installability, no console errors, light/dark.
7. README (run, build, deploy to Cloudflare Pages / GitHub Pages with a `base` note, iOS install), final summary + known limitations.
