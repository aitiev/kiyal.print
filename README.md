# KyialPrint

An offline-first order and expense tracker for a one-person home studio that makes personalised colouring books and Velcro ("липучка") play books. Built for iPhone and iPad (Safari, installed to the Home Screen) and works in desktop browsers too.

- **Orders:** child's name, product, topic, price, payment (unpaid / half / paid with the amount received), work status, due date, source, notes. Search, filters, sorting, one-tap payment and status changes with undo.
- **Expenses & ads:** categories, quantity → unit cost, monthly groups with category totals; ad spend by channel.
- **Home dashboard:** this month / last month / all time, received vs pending, average order, net profit, an income-vs-costs chart, break-even progress ("N more orders at your average"), a monthly income goal, and a strip of overdue or soon-due orders.
- **Settings:** Russian / English, currency (code + symbol), light / dark / auto theme, monthly goal, **backup to a JSON file and restore** (merge or replace), optional **PIN lock**, demo data, Home Screen install instructions.

Everything is stored locally in IndexedDB. There is no server and no account.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (the service worker is off in dev) |
| `npm run build` | Production build into `dist/` (with the service worker) |
| `npm run preview` | Serve `dist/` on http://localhost:4173 |
| `npm test` | Unit tests (Vitest + fake IndexedDB) |
| `npm run check` | Typecheck + lint + tests + build. Run before committing |
| `npm run e2e` | Browser flows against a running preview (needs Google Chrome; set `CHROME=/path/to/chrome` elsewhere) |
| `node scripts/shots.mjs --seed --full http://localhost:4173/ shots` | iPhone/iPad × light/dark screenshots plus console, overflow, installability, IndexedDB and offline checks |

## Deploy (free static hosting)

The build is a static folder (`dist/`). Navigation uses `#/` hash routes, so no rewrite rules are needed.

### Cloudflare Pages
1. Push the repo to GitHub or GitLab.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
3. Build command: `npm run build`. Build output directory: `dist`. Environment variable `NODE_VERSION=22`.
4. Deploy. The app is served from the root (`https://<project>.pages.dev/`), so no `BASE` is needed.

### GitHub Pages
GitHub Pages serves a project site from `/<repo>/`, so the build needs that base path: `BASE=/<repo>/ npm run build`.

The included workflow (`.github/workflows/pages.yml`) does it for you:
1. Push to `main`.
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. The site appears at `https://<user>.github.io/<repo>/`.

For a user site (`<user>.github.io`) or a custom domain, build without `BASE`.

HTTPS is required for the service worker, and both hosts provide it.

## Install on iPhone / iPad

1. Open the site in **Safari**. Other iOS browsers can't add it as a standalone app.
2. Tap **Share** (the square with an arrow).
3. Choose **Add to Home Screen**, then **Add**.

The app then opens full screen and works with no connection. Open it once while online after each update so the new version gets cached. Updates apply automatically on the next launch.

On Chrome or Edge (Android or desktop), use the **Install** button in Settings or the install icon in the address bar.

## Your data

- **Back up regularly:** Settings → Backup → **Save a backup**. On iPhone/iPad this opens the share sheet (save to Files, send to yourself in Telegram, etc.); on a computer it downloads `kyialprint-backup-YYYY-MM-DD.json`.
- **Restore:** Settings → Backup → **Restore from file**. The file is validated first and you see what's in it. Then:
  - **Merge** adds missing records and keeps whichever copy of a record was edited last. Nothing is deleted.
  - **Replace** wipes the current data (after a confirmation) and loads the file.
- Moving to a new device = backup on the old one, restore on the new one.
- The PIN, lock timeout and "last backup" time are per-device: they are never written to a backup and a restore doesn't change them.
- iOS may clear a site's storage if a non-installed site isn't used for a few weeks. Installing to the Home Screen and keeping backups protects you.

## PIN lock

Settings → PIN code. It is asked for at launch and after the app has been in the background for the chosen time (at once / 1 / 5 / 15 min). After 5 wrong attempts there is a growing wait (30 s, doubling up to 5 min).

The PIN keeps casual eyes out. It does **not** encrypt the data. The PIN is stored only as a salted PBKDF2 hash. If you forget it, the only way back in is clearing the site's data in the browser settings, which also deletes your records, so keep a backup.

## Tech

React 19 + TypeScript, Vite, Tailwind CSS 4, Dexie (IndexedDB) with live queries, Zustand, framer-motion, Recharts, date-fns, vite-plugin-pwa (Workbox). Money is stored as integers in minor units (1 som = 100 tyiyn) to avoid float errors.

```
src/
  components/   UI kit: Page, Card, Sheet, Button, Field, StatCard, ProgressBar, Toaster…
  db/           Dexie schema, repositories, live-query hooks, backup/restore, demo seed
  features/     dashboard, orders, expenses, settings, lock (PIN)
  hooks/        useT (i18n), useMoney, useToday, useTheme, useMedia, useFormState
  lib/          pure logic: money, dates, stats, validation, order queries, PIN hashing, i18n dictionaries
  store/        Zustand stores: UI, prefs, orders list, lock
scripts/        e2e.mjs, shots.mjs, gen-icons.mjs
docs/           PLAN, CHANGELOG, HANDOFF
```

## Known limitations

- **No sync between devices.** Data lives on one device; use backup/restore to move it.
- **No reliable reminders.** iOS web apps can't send dependable push notifications, so due dates are shown in the app (the dashboard strip and badges) instead.
- **The PIN is not encryption.** See above.
- **Storage can be evicted** by the browser in rare cases (especially Safari, for sites that aren't installed). Keep backups.
- **Single currency.** Changing the currency changes how amounts are displayed; it doesn't convert them.
