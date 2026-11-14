import Dexie, { type EntityTable } from 'dexie'
import type { Ad, Expense, Goal, Order, SettingRow } from './types'

export const DB_NAME = 'kyialprint'

export class KyialDB extends Dexie {
  orders!: EntityTable<Order, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  ads!: EntityTable<Ad, 'id'>
  goals!: EntityTable<Goal, 'id'>
  settings!: EntityTable<SettingRow, 'key'>

  constructor(name = DB_NAME) {
    super(name)
    // Only indexed fields are listed. Add a new version() for schema changes, never edit v1.
    this.version(1).stores({
      orders: 'id, createdAt, dueDate, paymentStatus, workStatus, product',
      expenses: 'id, date, category',
      ads: 'id, date',
      goals: 'id, type',
      settings: 'key',
    })
  }
}

export const db = new KyialDB()

export const ALL_TABLES = ['orders', 'expenses', 'ads', 'goals', 'settings'] as const
export type TableName = (typeof ALL_TABLES)[number]

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
