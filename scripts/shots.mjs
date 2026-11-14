// Visual + offline smoke test against a running `vite preview`.
// Usage: node scripts/shots.mjs [baseUrl] [outDir] [routes...]
// Env: CHROME=/path/to/chrome (defaults to macOS Google Chrome)
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const [base = 'http://localhost:4173/', out = 'shots', ...routesArg] = process.argv.slice(2)
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
  for (const [name, viewport] of Object.entries(devices)) {
    for (const scheme of ['light', 'dark']) {
      const page = await browser.newPage()
      page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}/${scheme}] ${m.text()}`))
      page.on('pageerror', (e) => errors.push(`[${name}/${scheme}] ${e.message}`))
      await page.setViewport(viewport)
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }])
      for (const r of routes) {
        const [tab, action] = r.split(':')
        await page.goto(`${base}#/${tab}`, { waitUntil: 'networkidle0' })
        if (action === 'fab') await page.click('button[aria-label][class*="fixed"]')
        await new Promise((res) => setTimeout(res, 700))
        await page.screenshot({ path: `${out}/${name}-${scheme}-${r.replace(':', '-')}.png` })
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
