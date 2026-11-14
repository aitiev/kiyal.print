import { db, newId } from '../schema'
import type { Minor, Order, OrderInput, PaymentStatus } from '../types'
import { defaultAmountReceived, nextWorkStatus } from '@/lib/defaults'

/** Strip undefined so stored rows (and backups) stay clean. */
export function compact<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
}

export const ordersRepo = {
  list: (): Promise<Order[]> => db.orders.orderBy('createdAt').reverse().toArray(),
  get: (id: string) => db.orders.get(id),

  async create(input: OrderInput, now = Date.now()): Promise<Order> {
    const row: Order = compact({ ...input, id: newId(), createdAt: now, updatedAt: now })
    await db.orders.add(row)
    return row
  },

  /** Full replace of editable fields (from the form). Keeps id/createdAt/demo. */
  async update(id: string, input: OrderInput, now = Date.now()): Promise<Order> {
    const prev = await db.orders.get(id)
    if (!prev) throw new Error(`Order ${id} not found`)
    const row: Order = compact({ ...input, id, createdAt: prev.createdAt, updatedAt: now, demo: prev.demo })
    await db.orders.put(row)
    return row
  },

  async setPayment(id: string, status: PaymentStatus, amountReceived?: Minor, now = Date.now()): Promise<Order | undefined> {
    const prev = await db.orders.get(id)
    if (!prev) return undefined
    const amount = Math.min(prev.price, Math.max(0, amountReceived ?? defaultAmountReceived(prev.price, status)))
    const row = { ...prev, paymentStatus: status, amountReceived: amount, updatedAt: now }
    await db.orders.put(row)
    return row
  },

  /** Moves work status one step forward; returns the updated order or undefined at the end. */
  async advanceWork(id: string, now = Date.now()): Promise<Order | undefined> {
    const prev = await db.orders.get(id)
    const next = prev && nextWorkStatus(prev.workStatus)
    if (!prev || !next) return undefined
    const row = { ...prev, workStatus: next, updatedAt: now }
    await db.orders.put(row)
    return row
  },

  /** Deletes and returns the row so the caller can offer undo via `restore`. */
  async remove(id: string): Promise<Order | undefined> {
    const prev = await db.orders.get(id)
    if (prev) await db.orders.delete(id)
    return prev
  },

  restore: (row: Order) => db.orders.put(row),
}
