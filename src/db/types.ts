/** Domain types. Money is integer minor units (tyiyn); see lib/money.ts. */
import type { ISODate } from '@/lib/dates'

export type Minor = number

export const PRODUCTS = ['colouring_book', 'velcro_book', 'other'] as const
export type Product = (typeof PRODUCTS)[number]

export const PAYMENT_STATUSES = ['unpaid', 'half', 'paid'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const WORK_STATUSES = ['new', 'in_progress', 'ready', 'delivered'] as const
export type WorkStatus = (typeof WORK_STATUSES)[number]

export const SOURCES = ['instagram', 'telegram', 'friend', 'other'] as const
export type Source = (typeof SOURCES)[number]

export const EXPENSE_CATEGORIES = ['paper', 'printing', 'velcro_felt', 'packaging', 'other'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const GOAL_TYPES = ['break_even', 'monthly_income'] as const
export type GoalType = (typeof GOAL_TYPES)[number]
export type GoalPeriod = 'all_time' | 'monthly'

interface Meta {
  id: string
  /** epoch ms */
  createdAt: number
  /** epoch ms: used by backup merge (newer wins) */
  updatedAt: number
  /** Seeded demo row; removed by "Remove demo data". */
  demo?: boolean
}

export interface Order extends Meta {
  childName: string
  product: Product
  topic: string
  price: Minor
  phone?: string
  dueDate?: ISODate
  extraPages: number
  gift: string
  paymentStatus: PaymentStatus
  amountReceived: Minor
  workStatus: WorkStatus
  source?: Source
  notes?: string
}

export interface Expense extends Meta {
  title: string
  price: Minor
  date: ISODate
  qty?: number
  unit?: string
  category: ExpenseCategory
}

export interface Ad extends Meta {
  title: string
  channel: string
  cost: Minor
  date: ISODate
  notes?: string
}

export interface Goal {
  /** One goal per type: id === type. */
  id: GoalType
  type: GoalType
  targetAmount?: Minor
  period: GoalPeriod
  updatedAt: number
}

export interface SettingRow {
  key: string
  value: unknown
}

/** Fields the user edits; meta is filled in by repositories. */
export type OrderInput = Omit<Order, keyof Meta>
export type ExpenseInput = Omit<Expense, keyof Meta>
export type AdInput = Omit<Ad, keyof Meta>
