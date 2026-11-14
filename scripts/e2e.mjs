// End-to-end flows against a running `vite preview` (fresh browser profile, Russian UI).
// Usage: node scripts/e2e.mjs [baseUrl]
import puppeteer from 'puppeteer-core'

const base = process.argv[2] ?? 'http://localhost:4173/'
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: chrome, headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(e.message))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// innerText with non-breaking spaces normalised (money uses U+00A0)
const text = () => page.evaluate(() => document.body.innerText.replace(/[\u00a0\u202f]/g, ' '))
let failed = 0
async function step(name, fn) {
  try {
    await fn()
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.log(`  ✗ ${name}\n    ${e.message}`)
    const info = await page.evaluate(() => {
      const d = document.querySelector('[role=dialog]')
      const r = d?.getBoundingClientRect()
      return { dialog: r && { top: r.top, bottom: r.bottom, h: r.height }, scrollY, inner: innerHeight, vv: visualViewport?.height }
    })
    console.log('    ' + JSON.stringify(info))
    await page.screenshot({ path: `e2e-failure-${failed}.png` })
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}
/** Wait until an open dialog has finished its enter animation (no transform). */
const settled = () =>
  page.waitForFunction(
    () => [...document.querySelectorAll('[role=dialog]')].every((d) => getComputedStyle(d).transform === 'none'),
    { timeout: 4000 },
  )
/** Wait until no dialog is open (sheet close animation finished). */
const noDialog = () => page.waitForFunction(() => !document.querySelector('[role=dialog]'), { timeout: 4000 })
async function clickText(label, scope = 'button') {
  // Retry: sheets spring into place, and a moving node isn't clickable yet.
  let lastErr
  for (let i = 0; i < 8; i++) {
    try {
      await settled()
      const el = await page.waitForSelector(`${scope} ::-p-text(${label})`, { timeout: 3000 })
      await el.click()
      await sleep(350)
      return
    } catch (e) {
      lastErr = e
      await sleep(250)
    }
  }
  throw lastErr
}
/** Click the last visible button whose text is exactly `label`. */
async function clickButtonExact(label) {
  await settled()
  const ok = await page.evaluate((l) => {
    const b = [...document.querySelectorAll('button')].filter((x) => x.textContent.trim() === l).pop()
    b?.click()
    return !!b
  }, label)
  assert(ok, `no button "${label}"`)
  await sleep(350)
}
async function waitText(s, present = true) {
  await page.waitForFunction((s, p) => document.body.innerText.replace(/[\u00a0\u202f]/g, ' ').includes(s) === p, { timeout: 4000 }, s, present)
}
async function typeInto(label, value) {
  const handle = await page
    .waitForFunction((l) => [...document.querySelectorAll('label')].find((x) => x.textContent.trim().startsWith(l))?.htmlFor, { timeout: 3000 }, label)
    .catch(() => null)
  const id = handle && (await handle.jsonValue())
  assert(id, `no field labelled ${label}`)
  await settled()
  await page.click(`[id="${id}"]`, { count: 3 })
  await page.keyboard.press('Backspace')
  await page.type(`[id="${id}"]`, value)
}
const fieldValue = (label) =>
  page.evaluate((l) => {
    const id = [...document.querySelectorAll('label')].find((x) => x.textContent.trim().startsWith(l))?.htmlFor
    return id ? document.getElementById(id).value : null
  }, label)

console.log('Orders')
await page.goto(`${base}#/orders`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.setItem('kp.prefs', JSON.stringify({ lang: 'ru' })))

await step('empty state is shown', async () => waitText('Пусто, как чистая раскраска'))

await step('validation shows inline errors', async () => {
  await page.click('button[aria-label="Новый заказ"]')
  await sleep(400)
  await clickText('Сохранить')
  const invalid = await page.$$eval('[aria-invalid="true"]', (els) => els.length)
  assert(invalid >= 3, `expected ≥3 invalid fields, got ${invalid}`)
  await waitText('Заполните это поле')
})

await step('create order with half payment (amount defaults to 50%)', async () => {
  await typeInto('Имя ребёнка', 'Айлин')
  await typeInto('Тема', 'Динозавры')
  await typeInto('Цена', '850')
  await clickText('Частично', '[role=tab]')
  const amount = await fieldValue('Получено')
  assert(amount === '425', `amount = ${amount}`)
  await clickText('Сохранить')
  await waitText('Заказ добавлен')
  await waitText('Айлин')
  await noDialog()
  assert((await text()).includes('850 сом'), 'price not shown')
})

await step('one-tap payment: half → paid, then undo', async () => {
  await page.click('button[aria-label^="Сменить оплату"]')
  await waitText('Оплата: Оплачено')
  await clickText('Вернуть')
  await page.waitForSelector('button[aria-label="Сменить оплату, сейчас: Частично"]')
})

await step('advance work status', async () => {
  await clickText('Взять в работу')
  await waitText('Статус: В работе')
})

await step('cycling from unpaid to half asks for the amount', async () => {
  await page.click('button[aria-label^="Сменить оплату"]') // half → paid
  await sleep(300)
  await page.click('button[aria-label^="Сменить оплату"]') // paid → unpaid
  await sleep(300)
  await page.click('button[aria-label^="Сменить оплату"]') // unpaid → half: prompt
  await waitText('Сколько получили?')
  await typeInto('Получено', '300')
  await clickText('Сохранить')
  await noDialog()
  await waitText('300 сом')
})

await step('edit order', async () => {
  await page.click('button[aria-label="Открыть заказ Айлин"]')
  await sleep(500)
  await typeInto('Тема', 'Космос')
  await clickText('Сохранить')
  await waitText('Изменения сохранены')
  await noDialog()
  await waitText('Космос')
})

await step('delete with confirmation, then undo', async () => {
  await page.click('button[aria-label="Открыть заказ Айлин"]')
  await sleep(500)
  await page.click('button[aria-label="Удалить заказ"]')
  await waitText('Удалить заказ?')
  await clickButtonExact('Удалить')
  await waitText('Заказ удалён')
  await noDialog()
  await waitText('Пусто, как чистая раскраска')
  await clickText('Вернуть')
  await waitText('Айлин')
})

await step('search with no results, then reset', async () => {
  await page.type('input[type=search]', 'zzz')
  await waitText('Ничего не нашлось')
  await clickText('Сбросить фильтры')
  await waitText('Айлин')
})

await step('data survives a reload', async () => {
  await page.reload({ waitUntil: 'networkidle0' })
  await waitText('Айлин')
})

await browser.close()
if (errors.length) {
  failed++
  console.log('Console errors:\n' + errors.join('\n'))
}
console.log(failed ? `FAILED (${failed})` : 'ALL PASSED')
process.exitCode = failed ? 1 : 0
