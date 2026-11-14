import { describe, expect, it } from 'vitest'
import { defaultAmountReceived, defaultDueDate, newExpenseDraft, newOrderDraft, nextPaymentStatus, nextWorkStatus, paymentStatusFor } from './defaults'

const NOW = new Date(2026, 10, 14, 10).getTime()

describe('defaults', () => {
  it('due date = created + 2 days', () => {
    expect(defaultDueDate(NOW)).toBe('2026-11-16')
    expect(defaultDueDate(new Date(2026, 11, 30))).toBe('2027-01-01')
  })
  it('amount received follows payment status', () => {
    expect(defaultAmountReceived(80000, 'unpaid')).toBe(0)
    expect(defaultAmountReceived(80000, 'half')).toBe(40000)
    expect(defaultAmountReceived(80001, 'half')).toBe(40001)
    expect(defaultAmountReceived(80000, 'paid')).toBe(80000)
  })
  it('order draft has smart defaults', () => {
    const d = newOrderDraft(NOW, 'Наклейка')
    expect(d).toMatchObject({ dueDate: '2026-11-16', extraPages: 0, gift: 'Наклейка', paymentStatus: 'unpaid', amountReceived: 0, workStatus: 'new' })
    expect(newOrderDraft(NOW).gift).toBe('Sticker')
    expect(newExpenseDraft(NOW).date).toBe('2026-11-14')
  })
  it('status transitions', () => {
    expect(nextWorkStatus('new')).toBe('in_progress')
    expect(nextWorkStatus('ready')).toBe('delivered')
    expect(nextWorkStatus('delivered')).toBeNull()
    expect(nextPaymentStatus('unpaid')).toBe('half')
    expect(nextPaymentStatus('half')).toBe('paid')
    expect(nextPaymentStatus('paid')).toBe('unpaid')
    expect(paymentStatusFor(1000, 0)).toBe('unpaid')
    expect(paymentStatusFor(1000, 300)).toBe('half')
    expect(paymentStatusFor(1000, 1000)).toBe('paid')
  })
})
