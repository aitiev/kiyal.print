/** Search, filter and sort for the orders list (pure). */
import type { Order, PaymentStatus, Product, WorkStatus } from '@/db/types'
import type { ISODate } from './dates'

export interface OrderFilter {
  search: string
  payment: PaymentStatus[]
  work: WorkStatus[]
  product: Product[]
  dueFrom: ISODate | null
  dueTo: ISODate | null
}

export const EMPTY_FILTER: OrderFilter = { search: '', payment: [], work: [], product: [], dueFrom: null, dueTo: null }

export type OrderSortKey = 'created' | 'due' | 'price' | 'name'
export interface OrderSort {
  key: OrderSortKey
  dir: 'asc' | 'desc'
}
export const DEFAULT_SORT: OrderSort = { key: 'created', dir: 'desc' }

/** Number of active (non-search) filters, for the filter badge. */
export function activeFilterCount(f: OrderFilter): number {
  return f.payment.length + f.work.length + f.product.length + (f.dueFrom || f.dueTo ? 1 : 0)
}

const norm = (s: string) => s.toLocaleLowerCase().replace(/ё/g, 'е').trim()

export function matchesFilter(o: Order, f: OrderFilter): boolean {
  const q = norm(f.search)
  if (q && !norm(o.childName).includes(q) && !norm(o.topic).includes(q)) return false
  if (f.payment.length && !f.payment.includes(o.paymentStatus)) return false
  if (f.work.length && !f.work.includes(o.workStatus)) return false
  if (f.product.length && !f.product.includes(o.product)) return false
  if (f.dueFrom || f.dueTo) {
    if (!o.dueDate) return false
    if (f.dueFrom && o.dueDate < f.dueFrom) return false
    if (f.dueTo && o.dueDate > f.dueTo) return false
  }
  return true
}

export function sortOrders(orders: Order[], s: OrderSort): Order[] {
  const m = s.dir === 'asc' ? 1 : -1
  const cmp = (a: Order, b: Order): number => {
    switch (s.key) {
      case 'created':
        return a.createdAt - b.createdAt
      case 'price':
        return a.price - b.price || a.createdAt - b.createdAt
      case 'name':
        return a.childName.localeCompare(b.childName) || a.createdAt - b.createdAt
      case 'due': {
        // Orders without a due date always go last.
        if (!a.dueDate || !b.dueDate) return 0
        return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : a.createdAt - b.createdAt
      }
    }
  }
  return [...orders].sort((a, b) => {
    if (s.key === 'due' && (!a.dueDate || !b.dueDate)) return (a.dueDate ? 0 : 1) - (b.dueDate ? 0 : 1)
    return cmp(a, b) * m
  })
}

export function queryOrders(orders: Order[], f: OrderFilter, s: OrderSort): Order[] {
  return sortOrders(orders.filter((o) => matchesFilter(o, f)), s)
}
