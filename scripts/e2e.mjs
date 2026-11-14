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
  const t0 = Date.now()
  try {
    await fn()
    console.log(`  ✓ ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
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

// ---------------------------------------------------------------- Expenses & Ads
/** Set a date input through React's value setter (typing into date inputs is locale-dependent). */
async function setDate(label, iso) {
  await settled()
  const ok = await page.evaluate(
    (l, v) => {
      const id = [...document.querySelectorAll('label')].find((x) => x.textContent.trim().startsWith(l))?.htmlFor
      const el = id && document.getElementById(id)
      if (!el) return false
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    },
    label,
    iso,
  )
  assert(ok, `no date field ${label}`)
}
const isoOffset = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const lastMonthIso = () => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-15`
}

console.log('Expenses & Ads')
await page.goto('about:blank')
await page.goto(`${base}#/expenses`, { waitUntil: 'networkidle0' })

await step('empty state is shown', async () => waitText('Здесь пока чисто'))

await step('add expense with qty → live and saved unit cost', async () => {
  await page.click('button[aria-label="Новый расход"]')
  await typeInto('Что купили', 'Бумага A4')
  await typeInto('Сумма', '650')
  await typeInto('Количество', '500')
  await typeInto('Единица', 'листов')
  await waitText('Выходит 1,30 сом / листов')
  await clickText('Сохранить')
  await waitText('Расход добавлен')
  await noDialog()
  await waitText('500 листов · 1,30 сом / листов')
  await waitText('650 сом')
})

await step('future date is rejected', async () => {
  await page.click('button[aria-label="Новый расход"]')
  await typeInto('Что купили', 'Картридж')
  await typeInto('Сумма', '2400')
  await setDate('Дата', isoOffset(1))
  await clickText('Сохранить')
  await waitText('Дата не может быть в будущем')
  await page.keyboard.press('Escape')
  await noDialog()
})

await step('earlier month creates a second month group', async () => {
  await page.click('button[aria-label="Новый расход"]')
  await typeInto('Что купили', 'Фетр')
  await typeInto('Сумма', '800')
  await setDate('Дата', lastMonthIso())
  await clickText('Липучки и фетр', 'button')
  await clickText('Сохранить')
  await noDialog()
  const headers = await page.$$eval('section h2', (hs) => hs.map((h) => h.textContent))
  assert(headers.length === 2, `month headers: ${JSON.stringify(headers)}`)
  await waitText('Липучки и фетр · 800 сом')
})

await step('edit expense', async () => {
  await page.click('button[aria-label="Открыть: Бумага A4"]')
  await typeInto('Сумма', '700')
  await clickText('Сохранить')
  await noDialog()
  await waitText('1,40 сом / листов')
})

await step('ads tab: add, edit, delete + undo', async () => {
  await clickText('Реклама', '[role=tab]')
  await waitText('Реклама пока не запускалась')
  await page.click('button[aria-label="Новая реклама"]')
  await typeInto('Название', 'Таргет')
  await typeInto('Канал', 'Instagram')
  await typeInto('Стоимость', '1500')
  await clickText('Сохранить')
  await waitText('Реклама добавлена')
  await noDialog()
  await waitText('1 500 сом')
  await page.click('button[aria-label="Открыть: Таргет"]')
  await page.waitForSelector('button[aria-label="Удалить рекламу"]')
  await settled()
  await page.click('button[aria-label="Удалить рекламу"]')
  await waitText('Удалить рекламу?')
  await clickButtonExact('Удалить')
  await waitText('Реклама удалена')
  await noDialog()
  await waitText('Реклама пока не запускалась')
  await clickText('Вернуть')
  await waitText('Таргет')
})

await step('expenses survive a reload', async () => {
  await page.reload({ waitUntil: 'networkidle0' })
  await waitText('Бумага A4')
})

await browser.close()
if (errors.length) {
  failed++
  console.log('Console errors:\n' + errors.join('\n'))
}
console.log(failed ? `FAILED (${failed})` : 'ALL PASSED')
// Exit explicitly: lingering puppeteer handles otherwise keep node alive for minutes.
process.exit(failed ? 1 : 0)
