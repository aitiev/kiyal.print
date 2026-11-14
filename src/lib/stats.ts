/** Pure business calculations for the dashboard and lists. All money in minor units. */
import type { Ad, Expense, ExpenseCategory, Minor, Order } from '@/db/types'
import { EXPENSE_CATEGORIES } from '@/db/types'
import {
  daysBetween,
  daysUntil,
  inRange,
  monthKey,
  monthKeysBetween,
  msInRange,
  toISODate,
  type DateRange,
  type ISODate,
} from './dates'
import { divideMinor, sumMinor } from './money'

export interface Dataset {
  orders: Order[]
  expenses: Expense[]
  ads: Ad[]
}

/** Orders by createdAt, expenses/ads by date. */
export function filterDataset(d: Dataset, r: DateRange): Dataset {
  return {
    orders: d.orders.filter((o) => msInRange(o.createdAt, r)),
    expenses: d.expenses.filter((e) => inRange(e.date, r)),
    ads: d.ads.filter((a) => inRange(a.date, r)),
  }
}

/** Money actually received. */
export function receivedTotal(orders: Order[]): Minor {
  return sumMinor(orders.map((o) => Math.max(0, o.amountReceived)))
}

/** Unpaid remainder of orders that are not fully paid. */
export function pendingTotal(orders: Order[]): Minor {
  return sumMinor(orders.filter((o) => o.paymentStatus !== 'paid').map((o) => Math.max(0, o.price - o.amountReceived)))
}

/** Average order price, or null when there are no orders. */
export function averageOrderValue(orders: Order[]): Minor | null {
  if (orders.length === 0) return null
  return Math.round(sumMinor(orders.map((o) => o.price)) / orders.length)
}

export const expensesTotal = (expenses: Expense[]): Minor => sumMinor(expenses.map((e) => e.price))
export const adsTotal = (ads: Ad[]): Minor => sumMinor(ads.map((a) => a.cost))

export interface Summary {
  orderCount: number
  received: Minor
  pending: Minor
  avgOrderValue: Minor | null
  expenses: Minor
  ads: Minor
  /** expenses + ads */
  costs: Minor
  /** received − expenses − ads */
  net: Minor
}

export function summarize(d: Dataset): Summary {
  const received = receivedTotal(d.orders)
  const expenses = expensesTotal(d.expenses)
  const ads = adsTotal(d.ads)
  return {
    orderCount: d.orders.length,
    received,
    pending: pendingTotal(d.orders),
    avgOrderValue: averageOrderValue(d.orders),
    expenses,
    ads,
    costs: expenses + ads,
    net: received - expenses - ads,
  }
}

export interface BreakEven {
  reached: boolean
  /** 0..1: received / costs (1 when there are no costs) */
  progress: number
  /** Amount still needed to reach net = 0 (0 when reached). */
  remaining: Minor
  /** ceil(remaining / avg order); null if no average yet; 0 when reached. */
  ordersNeeded: number | null
}

export function breakEven(s: Pick<Summary, 'received' | 'costs' | 'avgOrderValue'>): BreakEven {
  const remaining = Math.max(0, s.costs - s.received)
  if (remaining === 0) return { reached: true, progress: 1, remaining: 0, ordersNeeded: 0 }
  const progress = s.costs > 0 ? Math.min(1, s.received / s.costs) : 1
  const ordersNeeded = s.avgOrderValue && s.avgOrderValue > 0 ? Math.ceil(remaining / s.avgOrderValue) : null
  return { reached: false, progress, remaining, ordersNeeded }
}

export interface GoalProgress {
  target: Minor
  current: Minor
  progress: number
  remaining: Minor
  reached: boolean
}

export function goalProgress(current: Minor, target: Minor): GoalProgress | null {
  if (!(target > 0)) return null
  const remaining = Math.max(0, target - current)
  return { target, current, progress: Math.min(1, Math.max(0, current / target)), remaining, reached: remaining === 0 }
}

export interface SeriesPoint {
  /** "YYYY-MM" (month buckets) or "YYYY-MM-DD" (day buckets) */
  key: string
  income: Minor
  costs: Minor
  net: Minor
}

/**
 * Income vs costs buckets. Income = amountReceived attributed to the order's createdAt day.
 * - Bounded range → one bucket per day of the range (capped at `today` for the current month).
 * - All time → one bucket per month from the first data month to the current month.
 */
export function incomeCostSeries(d: Dataset, r: DateRange, now: Date | number = Date.now()): SeriesPoint[] {
  const today = toISODate(now)
  const byMonth = r.from === null || r.to === null
  const keyOf = (iso: ISODate) => (byMonth ? monthKey(iso) : iso)

  let keys: string[]
  if (byMonth) {
    const all = [
      ...d.orders.map((o) => toISODate(o.createdAt)),
      ...d.expenses.map((e) => e.date),
      ...d.ads.map((a) => a.date),
    ].filter((x) => inRange(x, r))
    if (all.length === 0) return []
    const first = all.reduce((a, b) => (a < b ? a : b))
    const last = all.reduce((a, b) => (a > b ? a : b))
    keys = monthKeysBetween(monthKey(first), monthKey(last > today ? last : today))
  } else {
    const end = r.to! > today && r.from! <= today ? today : r.to!
    keys = daysBetween(r.from!, end)
  }

  const map = new Map<string, SeriesPoint>(keys.map((k) => [k, { key: k, income: 0, costs: 0, net: 0 }]))
  const bump = (iso: ISODate, field: 'income' | 'costs', v: Minor) => {
    if (!inRange(iso, r)) return
    const p = map.get(keyOf(iso))
    if (p) p[field] += v
  }
  for (const o of d.orders) bump(toISODate(o.createdAt), 'income', Math.max(0, o.amountReceived))
  for (const e of d.expenses) bump(e.date, 'costs', e.price)
  for (const a of d.ads) bump(a.date, 'costs', a.cost)
  for (const p of map.values()) p.net = p.income - p.costs
  return [...map.values()]
}

export interface DueItem {
  order: Order
  /** calendar days until due; negative = overdue */
  days: number
}

/** Undelivered orders that are overdue or due within `soonDays`, most urgent first. */
export function dueSoon(orders: Order[], now: Date | number = Date.now(), soonDays = 3): { overdue: DueItem[]; soon: DueItem[] } {
  const items = orders
    .filter((o) => o.workStatus !== 'delivered' && o.dueDate)
    .map((o) => ({ order: o, days: daysUntil(o.dueDate!, now) }))
    .filter((x) => Number.isFinite(x.days) && x.days <= soonDays)
    .sort((a, b) => a.days - b.days || a.order.createdAt - b.order.createdAt)
  return { overdue: items.filter((x) => x.days < 0), soon: items.filter((x) => x.days >= 0) }
}

export type DueState = 'overdue' | 'today' | 'soon' | 'later' | 'none' | 'done'
export function dueState(o: Pick<Order, 'dueDate' | 'workStatus'>, now: Date | number = Date.now(), soonDays = 3): DueState {
  if (o.workStatus === 'delivered') return 'done'
  if (!o.dueDate) return 'none'
  const d = daysUntil(o.dueDate, now)
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  return d <= soonDays ? 'soon' : 'later'
}

/** Unit cost (price / qty) in minor units; null without a positive qty. */
export function unitCost(e: Pick<Expense, 'price' | 'qty'>): Minor | null {
  return e.qty == null ? null : divideMinor(e.price, e.qty)
}

export function categoryTotals(expenses: Expense[]): Record<ExpenseCategory, Minor> {
  const out = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, 0])) as Record<ExpenseCategory, Minor>
  for (const e of expenses) out[e.category] += e.price
  return out
}

export interface MonthGroup<T> {
  month: string
  items: T[]
  total: Minor
}

/** Group dated rows by month, newest month first, newest items first within a month. */
export function groupByMonth<T extends { date: ISODate; createdAt: number }>(rows: T[], amount: (row: T) => Minor): MonthGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const r of rows) {
    const k = monthKey(r.date)
    const list = map.get(k)
    if (list) list.push(r)
    else map.set(k, [r])
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([month, items]) => {
      items.sort((x, y) => (x.date === y.date ? y.createdAt - x.createdAt : x.date < y.date ? 1 : -1))
      return { month, items, total: sumMinor(items.map(amount)) }
    })
}
