// Visual + offline smoke test against a running `vite preview`.
// Usage: node scripts/shots.mjs [baseUrl] [outDir] [routes...]
// Env: CHROME=/path/to/chrome (defaults to macOS Google Chrome)
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

// Routes: "<tab>" or "<tab>:<action>" with action = "fab" | "click=<css selector>" (e.g. orders:click=[data-testid=filters]).
// Flag --seed: add demo data via Settings before taking screenshots. Flag --full: full-page screenshots.
const args = process.argv.slice(2)
const seed = args.includes('--seed')
const fullPage = args.includes('--full')
const [base = 'http://localhost:4173/', out = 'shots', ...routesArg] = args.filter((a) => !a.startsWith('--'))
const routes = routesArg.length ? routesArg : ['dashboard', 'orders', 'expenses', 'settings']
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
mkdirSync(out, { recursive: true })

const devices = {
  iphone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  ipad: { width: 820, height: 1180, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
}
const errors = []
const browser = await puppeteer.launch({ executablePath: chrome, headless: true })
try {
  if (seed) {
    const p = await browser.newPage()
    await p.goto(`${base}#/settings`, { waitUntil: 'networkidle0' })
    await p.waitForSelector('[data-testid=seed-demo], [data-testid=remove-demo]')
    if (await p.$('[data-testid=seed-demo]')) {
      await p.click('[data-testid=seed-demo]')
      await p.waitForSelector('[data-testid=remove-demo]')
    }
    console.log('SEED: OK')
    await p.close()
  }
  for (const [name, viewport] of Object.entries(devices)) {
    for (const scheme of ['light', 'dark']) {
      const page = await browser.newPage()
      page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}/${scheme}] ${m.text()}`))
      page.on('pageerror', (e) => errors.push(`[${name}/${scheme}] ${e.message}`))
      await page.setViewport(viewport)
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }])
      for (const r of routes) {
        const i = r.indexOf(':')
        const tab = i < 0 ? r : r.slice(0, i)
        const action = i < 0 ? '' : r.slice(i + 1)
        await page.goto('about:blank') // force a fresh load even if only the hash differs
        await page.goto(`${base}#/${tab}`, { waitUntil: 'networkidle0' })
        await new Promise((res) => setTimeout(res, 300))
        if (action === 'fab') await page.click('button[aria-label][class*="fixed"]')
        else if (action.startsWith('click=')) await page.click(action.slice(6))
        await new Promise((res) => setTimeout(res, 700))
        await page.screenshot({ path: `${out}/${name}-${scheme}-${r.replace(/[^\w-]+/g, '-')}.png`, fullPage })
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      if (overflow > 0) errors.push(`[${name}/${scheme}] horizontal overflow ${overflow}px`)
      await page.close()
    }
  }

  // Offline: first load installs the SW, then reload with the network cut.
  const page = await browser.newPage()
  await page.goto(base, { waitUntil: 'networkidle0' })
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller)
      await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }))
  })
  // Installability: Chrome's own check (manifest, icons, service worker), as used by Lighthouse.
  const cdp = await page.createCDPSession()
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors')
  if (installabilityErrors.length) {
    console.log('INSTALLABLE: NO')
    errors.push('installability: ' + installabilityErrors.map((e) => e.errorId).join(', '))
  } else console.log('INSTALLABLE: OK')
  // DB: the prefs row must be mirrored into IndexedDB settings.
  const prefs = await page.evaluate(
    () =>
      new Promise((res) => {
        const req = indexedDB.open('kyialprint')
        req.onerror = () => res(null)
        req.onsuccess = () => {
          try {
            const g = req.result.transaction('settings').objectStore('settings').get('prefs')
            g.onsuccess = () => res(g.result ?? null)
            g.onerror = () => res(null)
          } catch {
            res(null)
          }
        }
      }),
  )
  console.log(prefs ? `DB: OK (prefs ${JSON.stringify(prefs.value)})` : 'DB: prefs row missing')
  if (!prefs) errors.push('IndexedDB settings.prefs missing')
  await page.setOfflineMode(true)
  await page.reload({ waitUntil: 'networkidle0' })
  const ok = await page.evaluate(() => !!document.querySelector('nav') && document.body.innerText.length > 20)
  console.log(ok ? 'OFFLINE: OK' : 'OFFLINE: FAILED')
  if (!ok) errors.push('offline reload rendered nothing')
} finally {
  await browser.close()
}
if (errors.length) {
  console.log('PROBLEMS:\n' + errors.join('\n'))
  process.exitCode = 1
} else console.log('No console errors, no overflow.')
