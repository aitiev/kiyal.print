import { db, newId } from '../schema'
import type { Ad, AdInput } from '../types'
import { compact } from './orders'

export const adsRepo = {
  list: (): Promise<Ad[]> => db.ads.orderBy('date').reverse().toArray(),
  get: (id: string) => db.ads.get(id),
  async create(input: AdInput, now = Date.now()): Promise<Ad> {
    const row: Ad = compact({ ...input, id: newId(), createdAt: now, updatedAt: now })
    await db.ads.add(row)
    return row
  },
  async update(id: string, input: AdInput, now = Date.now()): Promise<Ad> {
    const prev = await db.ads.get(id)
    if (!prev) throw new Error(`Ad ${id} not found`)
    const row: Ad = compact({ ...input, id, createdAt: prev.createdAt, updatedAt: now, demo: prev.demo })
    await db.ads.put(row)
    return row
  },
  async remove(id: string): Promise<Ad | undefined> {
    const prev = await db.ads.get(id)
    if (prev) await db.ads.delete(id)
    return prev
  },
  restore: (row: Ad) => db.ads.put(row),
}
