import { describe, expect, it } from 'vitest'
import { ad, expense, order } from '@/test/factories'
import { periodRange } from './dates'
import {
  averageOrderValue,
  breakEven,
  categoryTotals,
  dueSoon,
  dueState,
  filterDataset,
  goalProgress,
  groupByMonth,
  incomeCostSeries,
  pendingTotal,
  receivedTotal,
  summarize,
  unitCost,
} from './stats'

const NOW = new Date(2026, 10, 14, 12)
const t = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime()

const data = {
  orders: [
    order({ price: 80000, paymentStatus: 'paid', amountReceived: 80000, createdAt: t(2026, 11, 2) }),
    order({ price: 120000, paymentStatus: 'half', amountReceived: 60000, createdAt: t(2026, 11, 10) }),
    order({ price: 70000, paymentStatus: 'unpaid', amountReceived: 0, createdAt: t(2026, 10, 20) }),
  ],
  expenses: [expense({ price: 65000, date: '2026-11-05' }), expense({ price: 30000, date: '2026-10-01', category: 'packaging' })],
  ads: [ad({ cost: 150000, date: '2026-11-03' })],
}

describe('stats', () => {
  it('received / pending / average', () => {
    expect(receivedTotal(data.orders)).toBe(140000)
    expect(pendingTotal(data.orders)).toBe(60000 + 70000)
    expect(averageOrderValue(data.orders)).toBe(90000)
    expect(averageOrderValue([])).toBeNull()
    // A "paid" order is never counted as pending even if the amount was edited lower.
    expect(pendingTotal([order({ paymentStatus: 'paid', price: 100, amountReceived: 50 })])).toBe(0)
  })

  it('summarizes a period (orders by createdAt, costs by date)', () => {
    const s = summarize(filterDataset(data, periodRange('this_month', NOW)))
    expect(s).toEqual({
      orderCount: 2,
      received: 140000,
      pending: 60000,
      avgOrderValue: 100000,
      expenses: 65000,
      ads: 150000,
      costs: 215000,
      net: 140000 - 65000 - 150000,
    })
    const all = summarize(data)
    expect(all.net).toBe(140000 - 95000 - 150000)
    expect(summarize({ orders: [], expenses: [], ads: [] }).avgOrderValue).toBeNull()
  })

  it('break-even', () => {
    expect(breakEven({ received: 140000, costs: 245000, avgOrderValue: 90000 })).toEqual({
      reached: false,
      progress: 140000 / 245000,
      remaining: 105000,
      ordersNeeded: 2,
    })
    expect(breakEven({ received: 300000, costs: 245000, avgOrderValue: 90000 })).toEqual({ reached: true, progress: 1, remaining: 0, ordersNeeded: 0 })
    expect(breakEven({ received: 0, costs: 0, avgOrderValue: null }).reached).toBe(true)
    expect(breakEven({ received: 0, costs: 5000, avgOrderValue: null })).toMatchObject({ progress: 0, ordersNeeded: null })
    // exact multiple: no extra order
    expect(breakEven({ received: 0, costs: 180000, avgOrderValue: 90000 }).ordersNeeded).toBe(2)
  })

  it('goal progress', () => {
    expect(goalProgress(50000, 200000)).toEqual({ target: 200000, current: 50000, progress: 0.25, remaining: 150000, reached: false })
    expect(goalProgress(250000, 200000)?.reached).toBe(true)
    expect(goalProgress(1, 0)).toBeNull()
  })

  it('daily series for a month, capped at today', () => {
    const s = incomeCostSeries(filterDataset(data, periodRange('this_month', NOW)), periodRange('this_month', NOW), NOW)
    expect(s).toHaveLength(14)
    expect(s[1]).toEqual({ key: '2026-11-02', income: 80000, costs: 0, net: 80000 })
    expect(s[2]).toEqual({ key: '2026-11-03', income: 0, costs: 150000, net: -150000 })
    const last = incomeCostSeries(data, periodRange('last_month', NOW), NOW)
    expect(last).toHaveLength(31)
    expect(last.find((p) => p.key === '2026-10-20')?.income).toBe(0) // unpaid
  })

  it('monthly series for all time, up to the current month', () => {
    const s = incomeCostSeries(data, periodRange('all_time', NOW), NOW)
    expect(s.map((p) => p.key)).toEqual(['2026-10', '2026-11'])
    expect(s[0]).toEqual({ key: '2026-10', income: 0, costs: 30000, net: -30000 })
    expect(s[1]).toMatchObject({ income: 140000, costs: 215000 })
    expect(incomeCostSeries({ orders: [], expenses: [], ads: [] }, periodRange('all_time', NOW), NOW)).toEqual([])
  })

  it('due soon / overdue, excluding delivered', () => {
    const os = [
      order({ id: 'late', dueDate: '2026-11-12' }),
      order({ id: 'today', dueDate: '2026-11-14' }),
      order({ id: 'soon', dueDate: '2026-11-17' }),
      order({ id: 'later', dueDate: '2026-11-25' }),
      order({ id: 'done', dueDate: '2026-11-10', workStatus: 'delivered' }),
      order({ id: 'nodate' }),
    ]
    const r = dueSoon(os, NOW)
    expect(r.overdue.map((x) => x.order.id)).toEqual(['late'])
    expect(r.soon.map((x) => [x.order.id, x.days])).toEqual([['today', 0], ['soon', 3]])
    expect(dueState(os[0]!, NOW)).toBe('overdue')
    expect(dueState(os[1]!, NOW)).toBe('today')
    expect(dueState(os[3]!, NOW)).toBe('later')
    expect(dueState(os[4]!, NOW)).toBe('done')
    expect(dueState(os[5]!, NOW)).toBe('none')
  })

  it('unit cost and category totals', () => {
    expect(unitCost({ price: 65000, qty: 500 })).toBe(130)
    expect(unitCost({ price: 65000 })).toBeNull()
    expect(unitCost({ price: 65000, qty: 0 })).toBeNull()
    expect(categoryTotals(data.expenses)).toEqual({ paper: 65000, printing: 0, velcro_felt: 0, packaging: 30000, other: 0 })
  })

  it('groups by month, newest first', () => {
    const rows = [
      expense({ date: '2026-10-01', price: 100 }),
      expense({ date: '2026-11-05', price: 200, createdAt: 1 }),
      expense({ date: '2026-11-05', price: 300, createdAt: 2 }),
      expense({ date: '2026-11-09', price: 400 }),
    ]
    const g = groupByMonth(rows, (e) => e.price)
    expect(g.map((x) => [x.month, x.total])).toEqual([['2026-11', 900], ['2026-10', 100]])
    expect(g[0]!.items.map((e) => e.price)).toEqual([400, 300, 200])
  })
})
