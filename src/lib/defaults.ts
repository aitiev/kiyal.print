/** Smart defaults and status transitions for orders, expenses and ads. */
import type { AdInput, ExpenseInput, Minor, OrderInput, PaymentStatus, WorkStatus } from '@/db/types'
import { PAYMENT_STATUSES, WORK_STATUSES } from '@/db/types'
import { addDaysISO, todayISO } from './dates'
import { percentOf } from './money'

export const DEFAULT_DUE_DAYS = 2
export const DEFAULT_GIFT = 'Sticker'
export const HALF_PERCENT = 50

/** Due date defaults to the creation date + 2 days. */
export function defaultDueDate(createdAt: Date | number): string {
  return addDaysISO(createdAt, DEFAULT_DUE_DAYS)
}

/** unpaid → 0, half → 50% of price, paid → full price. */
export function defaultAmountReceived(price: Minor, status: PaymentStatus): Minor {
  switch (status) {
    case 'paid':
      return price
    case 'half':
      return percentOf(price, HALF_PERCENT)
    case 'unpaid':
      return 0
  }
}

/** Blank order with all defaults. `gift` is the localised default label. */
export function newOrderDraft(now: Date | number = Date.now(), gift = DEFAULT_GIFT): OrderInput {
  return {
    childName: '',
    product: 'colouring_book',
    topic: '',
    price: 0,
    dueDate: defaultDueDate(now),
    extraPages: 0,
    gift,
    paymentStatus: 'unpaid',
    amountReceived: 0,
    workStatus: 'new',
  }
}

export function newExpenseDraft(now: Date | number = Date.now()): ExpenseInput {
  return { title: '', price: 0, date: todayISO(now), category: 'paper' }
}

export function newAdDraft(now: Date | number = Date.now()): AdInput {
  return { title: '', channel: '', cost: 0, date: todayISO(now) }
}

/** new → in_progress → ready → delivered; null when already delivered. */
export function nextWorkStatus(s: WorkStatus): WorkStatus | null {
  const i = WORK_STATUSES.indexOf(s)
  return i >= 0 && i < WORK_STATUSES.length - 1 ? WORK_STATUSES[i + 1]! : null
}

/** One-tap cycle: unpaid → half → paid → unpaid. */
export function nextPaymentStatus(s: PaymentStatus): PaymentStatus {
  const i = PAYMENT_STATUSES.indexOf(s)
  return PAYMENT_STATUSES[(i + 1) % PAYMENT_STATUSES.length]!
}

/** Infer the payment status from an amount (used when the user edits the amount). */
export function paymentStatusFor(price: Minor, received: Minor): PaymentStatus {
  if (received <= 0) return 'unpaid'
  if (received >= price) return 'paid'
  return 'half'
}
