import { describe, expect, it } from 'vitest'
import { order } from '@/test/factories'
import { activeFilterCount, EMPTY_FILTER, queryOrders, sortOrders } from './orderQuery'

const os = [
  order({ id: 'a', childName: 'Алёна', topic: 'Единороги', price: 900, dueDate: '2026-11-20', createdAt: 3, paymentStatus: 'paid', workStatus: 'ready' }),
  order({ id: 'b', childName: 'Тимур', topic: 'Машинки', price: 500, createdAt: 1, product: 'velcro_book' }),
  order({ id: 'c', childName: 'Бекжан', topic: 'Космос', price: 700, dueDate: '2026-11-15', createdAt: 2 }),
]
const ids = (x: { id: string }[]) => x.map((o) => o.id)

describe('orderQuery', () => {
  it('searches name and topic, case/ё-insensitive', () => {
    expect(ids(queryOrders(os, { ...EMPTY_FILTER, search: 'алена' }, { key: 'created', dir: 'desc' }))).toEqual(['a'])
    expect(ids(queryOrders(os, { ...EMPTY_FILTER, search: 'КОСМ' }, { key: 'created', dir: 'desc' }))).toEqual(['c'])
  })
  it('filters by status, product and due range', () => {
    const s = { key: 'created', dir: 'asc' } as const
    expect(ids(queryOrders(os, { ...EMPTY_FILTER, payment: ['unpaid'] }, s))).toEqual(['b', 'c'])
    expect(ids(queryOrders(os, { ...EMPTY_FILTER, work: ['ready'] }, s))).toEqual(['a'])
    expect(ids(queryOrders(os, { ...EMPTY_FILTER, product: ['velcro_book'] }, s))).toEqual(['b'])
    expect(ids(queryOrders(os, { ...EMPTY_FILTER, dueFrom: '2026-11-16' }, s))).toEqual(['a'])
    expect(ids(queryOrders(os, { ...EMPTY_FILTER, dueTo: '2026-11-15' }, s))).toEqual(['c'])
    expect(activeFilterCount({ ...EMPTY_FILTER, payment: ['paid', 'half'], dueTo: 'x' })).toBe(3)
  })
  it('sorts; missing due dates always last', () => {
    expect(ids(sortOrders(os, { key: 'due', dir: 'asc' }))).toEqual(['c', 'a', 'b'])
    expect(ids(sortOrders(os, { key: 'due', dir: 'desc' }))).toEqual(['a', 'c', 'b'])
    expect(ids(sortOrders(os, { key: 'price', dir: 'desc' }))).toEqual(['a', 'c', 'b'])
    expect(ids(sortOrders(os, { key: 'created', dir: 'desc' }))).toEqual(['a', 'c', 'b'])
    expect(ids(sortOrders(os, { key: 'name', dir: 'asc' }))).toEqual(['a', 'c', 'b'])
  })
})
