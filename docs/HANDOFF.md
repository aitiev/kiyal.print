# Handoff: start here

**Current state:** all 6 phases are done (v1.0.0). The app is feature-complete per `initial_prompt.md`: orders, expenses & ads, dashboard & goals, settings, backup/restore, PIN lock, PWA install/offline, ru/en, README with deploy instructions.

## How to work
- `npm run check`: typecheck + lint + test + build. Must pass before committing.
- Preview: `npm run build && (npx vite preview --port 4173 --strictPort > /tmp/kp-preview.log 2>&1 &)`, then:
  - `npm run e2e` (~45 s, 30 flows in 4 sections). Helpers are listed at the top of `scripts/e2e.mjs`; the Settings section adds `counts()` (IndexedDB row counts) and `pressPin(pin)`.
  - `node scripts/shots.mjs [--seed] [--full] http://localhost:4173/ <dir> <routes...>` (route = `tab` or `tab:click=<css>`): screenshots + console/overflow/installability/IndexedDB/offline checks.
  - Stop the preview: `pkill -f "vite preview --port 4173"`.
- Gotchas: use ` ` escapes, never literal NBSP characters. No `Date.now()` in render (use `useToday()`). No `autoFocus` in sheets. Tailwind classes must be static strings. Toasts can cover bottom buttons in e2e: wait for `[role=status]` to disappear. Headless Chrome's share sheet never resolves: e2e removes `navigator.canShare` before exporting.

## Not verified here
- A Lighthouse run: `npx lighthouse` was blocked in this environment. Chrome's installability check passes, and offline reload works.
- Real iOS Safari (share sheet with a file, Home Screen install, `inert`, Web Crypto PBKDF2). These are standard Safari 16.4+ APIs but haven't been run on a device.

## Ideas if work continues
- Reminder of the last backup age on the dashboard (e.g. after 14 days).
- CSV export of orders/expenses for spreadsheets.
- Lighthouse in CI; a masonry layout for Settings on iPad.
