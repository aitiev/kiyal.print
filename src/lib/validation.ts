/**
 * Form validation. Forms hold raw strings; `parse*Form` validates and converts them into
 * repository inputs. Errors are i18n keys so the UI can show inline localised messages.
 */
import type { AdInput, ExpenseInput, OrderInput, PaymentStatus, Product, Source, WorkStatus, ExpenseCategory } from '@/db/types'
import { EXPENSE_CATEGORIES, PAYMENT_STATUSES, PRODUCTS, SOURCES, WORK_STATUSES } from '@/db/types'
import type { MsgKey } from './i18n'
import { isValidISODate, todayISO } from './dates'
import { parseDecimal, parseMoney } from './money'

export type Errors<F> = Partial<Record<keyof F, MsgKey>>
export type ParseResult<F, T> = { ok: true; value: T } | { ok: false; errors: Errors<F> }

export const LIMITS = {
  name: 60,
  text: 120,
  notes: 1000,
  maxMoney: 100_000_000_00, // 100M som
  maxPages: 1000,
  maxQty: 1_000_000,
} as const

export interface OrderForm {
  childName: string
  product: Product
  topic: string
  price: string
  phone: string
  dueDate: string
  extraPages: string
  gift: string
  paymentStatus: PaymentStatus
  amountReceived: string
  workStatus: WorkStatus
  source: Source | ''
  notes: string
}

export interface ExpenseForm {
  title: string
  price: string
  date: string
  qty: string
  unit: string
  category: ExpenseCategory
}

export interface AdForm {
  title: string
  channel: string
  cost: string
  date: string
  notes: string
}

const oneOf = <T extends string>(list: readonly T[], v: string): v is T => (list as readonly string[]).includes(v)
const opt = (s: string) => (s.trim() === '' ? undefined : s.trim())

function requiredText(v: string, max: number): MsgKey | undefined {
  if (!v.trim()) return 'validation.required'
  if (v.trim().length > max) return 'validation.tooLong'
}
function optionalText(v: string, max: number): MsgKey | undefined {
  if (v.trim().length > max) return 'validation.tooLong'
}
function money(v: string, { required = true, allowZero = false } = {}): { error?: MsgKey; value?: number } {
  if (!v.trim()) return required ? { error: 'validation.required' } : { value: 0 }
  const m = parseMoney(v)
  if (m === null) return { error: 'validation.invalidNumber' }
  if (m === 0 && !allowZero) return { error: 'validation.positive' }
  if (m > LIMITS.maxMoney) return { error: 'validation.tooLarge' }
  return { value: m }
}

/** Phone: optional; 7–15 digits; may contain + spaces ( ) -. */
export function isValidPhone(v: string): boolean {
  if (!/^\+?[\d\s()-]+$/.test(v)) return false
  const digits = v.replace(/\D/g, '').length
  return digits >= 7 && digits <= 15
}

function pastOrTodayDate(v: string, now: number): MsgKey | undefined {
  if (!v) return 'validation.required'
  if (!isValidISODate(v)) return 'validation.invalidDate'
  if (v > todayISO(now)) return 'validation.futureDate'
}

export function parseOrderForm(f: OrderForm): ParseResult<OrderForm, OrderInput> {
  const e: Errors<OrderForm> = {}
  e.childName = requiredText(f.childName, LIMITS.name)
  e.topic = requiredText(f.topic, LIMITS.text)
  e.gift = optionalText(f.gift, LIMITS.text)
  e.notes = optionalText(f.notes, LIMITS.notes)
  if (!oneOf(PRODUCTS, f.product)) e.product = 'validation.invalidOption'
  if (!oneOf(PAYMENT_STATUSES, f.paymentStatus)) e.paymentStatus = 'validation.invalidOption'
  if (!oneOf(WORK_STATUSES, f.workStatus)) e.workStatus = 'validation.invalidOption'
  if (f.source !== '' && !oneOf(SOURCES, f.source)) e.source = 'validation.invalidOption'

  const price = money(f.price)
  e.price = price.error
  const received = money(f.amountReceived, { required: false, allowZero: true })
  e.amountReceived = received.error
  if (!e.amountReceived && price.value !== undefined && received.value! > price.value) e.amountReceived = 'validation.exceedsPrice'

  if (f.phone.trim() && !isValidPhone(f.phone.trim())) e.phone = 'validation.invalidPhone'
  if (f.dueDate && !isValidISODate(f.dueDate)) e.dueDate = 'validation.invalidDate'

  let extraPages = 0
  if (f.extraPages.trim()) {
    const n = Number(f.extraPages.trim())
    if (!Number.isFinite(n) || !/^\d+$/.test(f.extraPages.trim())) e.extraPages = 'validation.integer'
    else if (n > LIMITS.maxPages) e.extraPages = 'validation.tooLarge'
    else extraPages = n
  }

  const errors = clean(e)
  if (errors) return { ok: false, errors }
  return {
    ok: true,
    value: {
      childName: f.childName.trim(),
      product: f.product,
      topic: f.topic.trim(),
      price: price.value!,
      phone: opt(f.phone),
      dueDate: f.dueDate || undefined,
      extraPages,
      gift: f.gift.trim(),
      paymentStatus: f.paymentStatus,
      amountReceived: received.value!,
      workStatus: f.workStatus,
      source: f.source || undefined,
      notes: opt(f.notes),
    },
  }
}

export function parseExpenseForm(f: ExpenseForm, now: number = Date.now()): ParseResult<ExpenseForm, ExpenseInput> {
  const e: Errors<ExpenseForm> = {}
  e.title = requiredText(f.title, LIMITS.text)
  e.unit = optionalText(f.unit, 30)
  const price = money(f.price)
  e.price = price.error
  e.date = pastOrTodayDate(f.date, now)
  if (!oneOf(EXPENSE_CATEGORIES, f.category)) e.category = 'validation.invalidOption'
  let qty: number | undefined
  if (f.qty.trim()) {
    const q = parseDecimal(f.qty)
    if (q === null) e.qty = 'validation.invalidNumber'
    else if (q <= 0) e.qty = 'validation.positive'
    else if (q > LIMITS.maxQty) e.qty = 'validation.tooLarge'
    else qty = q
  }
  const errors = clean(e)
  if (errors) return { ok: false, errors }
  return {
    ok: true,
    value: { title: f.title.trim(), price: price.value!, date: f.date, qty, unit: qty ? opt(f.unit) : undefined, category: f.category },
  }
}

export function parseAdForm(f: AdForm, now: number = Date.now()): ParseResult<AdForm, AdInput> {
  const e: Errors<AdForm> = {}
  e.title = requiredText(f.title, LIMITS.text)
  e.channel = requiredText(f.channel, LIMITS.name)
  e.notes = optionalText(f.notes, LIMITS.notes)
  const cost = money(f.cost)
  e.cost = cost.error
  e.date = pastOrTodayDate(f.date, now)
  const errors = clean(e)
  if (errors) return { ok: false, errors }
  return { ok: true, value: { title: f.title.trim(), channel: f.channel.trim(), cost: cost.value!, date: f.date, notes: opt(f.notes) } }
}

function clean<F>(e: Errors<F>): Errors<F> | null {
  const out: Errors<F> = {}
  let any = false
  for (const k in e) {
    if (e[k]) {
      out[k] = e[k]
      any = true
    }
  }
  return any ? out : null
}
