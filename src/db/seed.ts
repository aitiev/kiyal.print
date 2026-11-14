/**
 * Demo data for reviewing the dashboard. Every row has `demo: true`, so
 * `removeDemoData()` deletes exactly these rows and leaves real data alone.
 */
import { addDays, subDays } from 'date-fns'
import { db, newId, type KyialDB } from './schema'
import type { Ad, Expense, ExpenseCategory, Order, PaymentStatus, Product, Source, WorkStatus } from './types'
import { addDaysISO, toISODate } from '@/lib/dates'
import { defaultAmountReceived } from '@/lib/defaults'
import { toMinor } from '@/lib/money'

/** Small deterministic PRNG so demo data (and tests) are reproducible. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NAMES = ['Айлин', 'Нурислам', 'Амина', 'Эмир', 'Медина', 'Алихан', 'Сафия', 'Тимур', 'Айсулуу', 'Бекжан', 'Аруузат', 'Адем', 'Мирон', 'Ясмина', 'Расул', 'Камила']
const TOPICS = ['Холодное сердце', 'Щенячий патруль', 'Динозавры', 'Единороги', 'Машинки', 'Принцессы', 'Космос', 'Фиксики', 'Алфавит', 'Животные фермы', 'Цифры и счёт', 'Морские обитатели']
const GIFTS = ['Наклейка', 'Наклейка', 'Наклейка', 'Карандаши', 'Брелок']
const SOURCES_W: Source[] = ['instagram', 'instagram', 'instagram', 'telegram', 'friend', 'other']

const EXPENSES: Array<{ title: string; price: number; qty?: number; unit?: string; category: ExpenseCategory }> = [
  { title: 'Бумага A4 плотная', price: 650, qty: 500, unit: 'листов', category: 'paper' },
  { title: 'Ламинирующая плёнка', price: 900, qty: 100, unit: 'шт', category: 'printing' },
  { title: 'Картридж для принтера', price: 2400, qty: 1, unit: 'шт', category: 'printing' },
  { title: 'Липучки', price: 1200, qty: 20, unit: 'м', category: 'velcro_felt' },
  { title: 'Фетр цветной', price: 800, qty: 40, unit: 'листов', category: 'velcro_felt' },
  { title: 'Крафт-пакеты', price: 450, qty: 50, unit: 'шт', category: 'packaging' },
  { title: 'Пружины для переплёта', price: 700, qty: 100, unit: 'шт', category: 'printing' },
  { title: 'Наклейки-подарки', price: 350, qty: 60, unit: 'шт', category: 'other' },
]
const ADS = [
  { title: 'Таргет в Instagram', channel: 'Instagram', cost: 1500 },
  { title: 'Пост в мамском чате', channel: 'Telegram', cost: 500 },
  { title: 'Сторис у блогера', channel: 'Instagram', cost: 2000 },
]

export interface DemoData {
  orders: Order[]
  expenses: Expense[]
  ads: Ad[]
}

/** Builds ~3 months of plausible data ending at `now`. Pure (no DB). */
export function buildDemoData(now = Date.now(), seed = 42): DemoData {
  const rnd = mulberry32(seed)
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!
  const today = new Date(now)

  const orders: Order[] = []
  for (let i = 0; i < 18; i++) {
    const ageDays = Math.floor(rnd() * 85)
    const created = subDays(today, ageDays)
    created.setHours(9 + Math.floor(rnd() * 10), Math.floor(rnd() * 60))
    const product: Product = rnd() < 0.6 ? 'colouring_book' : rnd() < 0.85 ? 'velcro_book' : 'other'
    const base = product === 'colouring_book' ? 600 + Math.floor(rnd() * 4) * 100 : product === 'velcro_book' ? 1200 + Math.floor(rnd() * 7) * 100 : 500
    const extraPages = rnd() < 0.3 ? 2 + Math.floor(rnd() * 6) : 0
    const price = toMinor(base + extraPages * 30)
    // Older orders are mostly finished and paid; recent ones are in progress.
    const work: WorkStatus = ageDays > 10 ? 'delivered' : ageDays > 5 ? pick(['ready', 'delivered'] as const) : ageDays > 2 ? 'in_progress' : 'new'
    const pay: PaymentStatus = work === 'delivered' ? (rnd() < 0.9 ? 'paid' : 'half') : pick(['unpaid', 'half', 'half', 'paid'] as const)
    const ms = created.getTime()
    orders.push({
      id: newId(),
      childName: pick(NAMES),
      product,
      topic: pick(TOPICS),
      price,
      phone: rnd() < 0.7 ? `+996 70${Math.floor(rnd() * 10)} ${String(100000 + Math.floor(rnd() * 899999))}` : undefined,
      dueDate: addDaysISO(created, 2 + Math.floor(rnd() * 3)),
      extraPages,
      gift: pick(GIFTS),
      paymentStatus: pay,
      amountReceived: defaultAmountReceived(price, pay),
      workStatus: work,
      source: pick(SOURCES_W),
      notes: rnd() < 0.2 ? 'Имя на обложке крупно' : undefined,
      createdAt: ms,
      updatedAt: ms,
      demo: true,
    })
  }
  // Make the due strip interesting: one overdue, one due today, one tomorrow.
  const urgent: Array<[number, number]> = [[-4, -1], [-2, 0], [-1, 1]]
  for (const [createdOffset, dueOffset] of urgent) {
    const created = addDays(today, createdOffset).getTime()
    const price = toMinor(800)
    orders.push({
      id: newId(),
      childName: pick(NAMES),
      product: 'colouring_book',
      topic: pick(TOPICS),
      price,
      dueDate: addDaysISO(today, dueOffset),
      extraPages: 0,
      gift: 'Наклейка',
      paymentStatus: 'half',
      amountReceived: defaultAmountReceived(price, 'half'),
      workStatus: 'in_progress',
      source: 'instagram',
      createdAt: created,
      updatedAt: created,
      demo: true,
    })
  }

  const expenses: Expense[] = []
  for (let m = 0; m < 3; m++) {
    for (const e of EXPENSES) {
      if (m > 0 && rnd() < 0.45) continue
      const date = subDays(today, m * 30 + Math.floor(rnd() * 25))
      const ms = date.getTime()
      expenses.push({ id: newId(), ...e, price: toMinor(e.price), date: toISODate(date), createdAt: ms, updatedAt: ms, demo: true })
    }
  }

  const ads: Ad[] = ADS.map((a, i) => {
    const date = subDays(today, i * 27 + Math.floor(rnd() * 10))
    const ms = date.getTime()
    return { id: newId(), ...a, cost: toMinor(a.cost), date: toISODate(date), createdAt: ms, updatedAt: ms, demo: true }
  })

  // Drop undefined optional fields so rows match what repositories store.
  const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
  return { orders: orders.map(clean), expenses: expenses.map(clean), ads: ads.map(clean) }
}

export async function seedDemoData(database: KyialDB = db, now = Date.now()): Promise<{ orders: number; expenses: number; ads: number }> {
  const d = buildDemoData(now)
  await database.transaction('rw', database.orders, database.expenses, database.ads, async () => {
    await database.orders.bulkAdd(d.orders)
    await database.expenses.bulkAdd(d.expenses)
    await database.ads.bulkAdd(d.ads)
  })
  return { orders: d.orders.length, expenses: d.expenses.length, ads: d.ads.length }
}

export async function hasDemoData(database: KyialDB = db): Promise<boolean> {
  const [o, e, a] = await Promise.all([
    database.orders.filter((r) => r.demo === true).count(),
    database.expenses.filter((r) => r.demo === true).count(),
    database.ads.filter((r) => r.demo === true).count(),
  ])
  return o + e + a > 0
}

export async function removeDemoData(database: KyialDB = db): Promise<number> {
  return database.transaction('rw', database.orders, database.expenses, database.ads, async () => {
    const counts = await Promise.all([
      database.orders.filter((r) => r.demo === true).delete(),
      database.expenses.filter((r) => r.demo === true).delete(),
      database.ads.filter((r) => r.demo === true).delete(),
    ])
    return counts.reduce((a, b) => a + b, 0)
  })
}
