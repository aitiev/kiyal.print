import { describe, expect, it } from 'vitest'
import { adToForm, expenseToForm, orderToForm } from './forms'
import { newAdDraft, newExpenseDraft, newOrderDraft } from './defaults'
import { isValidPhone, parseAdForm, parseExpenseForm, parseOrderForm, type OrderForm } from './validation'

const NOW = new Date(2026, 10, 14, 12).getTime()
const baseOrder = (): OrderForm => ({ ...orderToForm(newOrderDraft(NOW, 'Наклейка'), 'ru'), childName: ' Айлин ', topic: 'Космос', price: '850' })

describe('validation', () => {
  it('parses a valid order form', () => {
    const r = parseOrderForm({ ...baseOrder(), phone: '+996 700 123 456', paymentStatus: 'half', amountReceived: '425', extraPages: '3', notes: '  ' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value).toMatchObject({ childName: 'Айлин', price: 85000, amountReceived: 42500, extraPages: 3, dueDate: '2026-11-16', gift: 'Наклейка' })
    expect(r.value.notes).toBeUndefined()
    expect(r.value.source).toBeUndefined()
  })
  it('reports inline errors as i18n keys', () => {
    const r = parseOrderForm({ ...baseOrder(), childName: '', price: 'abc', phone: '12', extraPages: '1.5', dueDate: '2026-02-31' })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors).toEqual({
      childName: 'validation.required',
      price: 'validation.invalidNumber',
      phone: 'validation.invalidPhone',
      extraPages: 'validation.integer',
      dueDate: 'validation.invalidDate',
    })
  })
  it('rejects zero price and amount above price; due date may be cleared', () => {
    const r1 = parseOrderForm({ ...baseOrder(), price: '0' })
    expect(!r1.ok && r1.errors.price).toBe('validation.positive')
    const r2 = parseOrderForm({ ...baseOrder(), amountReceived: '900' })
    expect(!r2.ok && r2.errors.amountReceived).toBe('validation.exceedsPrice')
    const r3 = parseOrderForm({ ...baseOrder(), dueDate: '' })
    expect(r3.ok && r3.value.dueDate).toBeUndefined()
  })
  it('phones', () => {
    expect(isValidPhone('+996 (700) 12-34-56')).toBe(true)
    expect(isValidPhone('0700123456')).toBe(true)
    expect(isValidPhone('12345')).toBe(false)
    expect(isValidPhone('abc1234567')).toBe(false)
  })
  it('expense: no future dates, qty optional, unit kept only with qty', () => {
    const f = { ...expenseToForm(newExpenseDraft(NOW), 'ru'), title: 'Бумага', price: '650', qty: '500', unit: 'листов' }
    const ok = parseExpenseForm(f, NOW)
    expect(ok.ok && ok.value).toMatchObject({ price: 65000, qty: 500, unit: 'листов', date: '2026-11-14' })
    const past = parseExpenseForm({ ...f, date: '2026-01-02' }, NOW)
    expect(past.ok).toBe(true)
    const fut = parseExpenseForm({ ...f, date: '2026-11-15' }, NOW)
    expect(!fut.ok && fut.errors.date).toBe('validation.futureDate')
    const noQty = parseExpenseForm({ ...f, qty: '' }, NOW)
    expect(noQty.ok && noQty.value.unit).toBeUndefined()
    const badQty = parseExpenseForm({ ...f, qty: '0' }, NOW)
    expect(!badQty.ok && badQty.errors.qty).toBe('validation.positive')
  })
  it('ad form', () => {
    const f = { ...adToForm(newAdDraft(NOW), 'en'), title: 'Target', channel: 'Instagram', cost: '1500.50' }
    const r = parseAdForm(f, NOW)
    expect(r.ok && r.value).toMatchObject({ cost: 150050, channel: 'Instagram' })
    const bad = parseAdForm({ ...f, channel: ' ' }, NOW)
    expect(!bad.ok && bad.errors.channel).toBe('validation.required')
  })
  it('form round-trip keeps values', () => {
    const r = parseOrderForm(baseOrder())
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(parseOrderForm(orderToForm(r.value, 'en'))).toEqual(r)
  })
})
