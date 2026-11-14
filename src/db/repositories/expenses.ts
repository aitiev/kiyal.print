import { db, newId } from '../schema'
import type { Expense, ExpenseInput } from '../types'
import { compact } from './orders'

export const expensesRepo = {
  list: (): Promise<Expense[]> => db.expenses.orderBy('date').reverse().toArray(),
  get: (id: string) => db.expenses.get(id),
  async create(input: ExpenseInput, now = Date.now()): Promise<Expense> {
    const row: Expense = compact({ ...input, id: newId(), createdAt: now, updatedAt: now })
    await db.expenses.add(row)
    return row
  },
  async update(id: string, input: ExpenseInput, now = Date.now()): Promise<Expense> {
    const prev = await db.expenses.get(id)
    if (!prev) throw new Error(`Expense ${id} not found`)
    const row: Expense = compact({ ...input, id, createdAt: prev.createdAt, updatedAt: now, demo: prev.demo })
    await db.expenses.put(row)
    return row
  },
  async remove(id: string): Promise<Expense | undefined> {
    const prev = await db.expenses.get(id)
    if (prev) await db.expenses.delete(id)
    return prev
  },
  restore: (row: Expense) => db.expenses.put(row),
}
