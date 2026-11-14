/** Entity/draft → raw form strings (the inverse of validation.parse*Form). */
import type { AdInput, ExpenseInput, OrderInput } from '@/db/types'
import type { Lang } from './i18n'
import { toInputString } from './money'
import type { AdForm, ExpenseForm, OrderForm } from './validation'

const num = (n: number | undefined, lang: Lang) => (n == null ? '' : lang === 'ru' ? String(n).replace('.', ',') : String(n))

export function orderToForm(o: OrderInput, lang: Lang): OrderForm {
  return {
    childName: o.childName,
    product: o.product,
    topic: o.topic,
    price: o.price ? toInputString(o.price, lang) : '',
    phone: o.phone ?? '',
    dueDate: o.dueDate ?? '',
    extraPages: String(o.extraPages ?? 0),
    gift: o.gift,
    paymentStatus: o.paymentStatus,
    amountReceived: toInputString(o.amountReceived, lang),
    workStatus: o.workStatus,
    source: o.source ?? '',
    notes: o.notes ?? '',
  }
}

export function expenseToForm(e: ExpenseInput, lang: Lang): ExpenseForm {
  return {
    title: e.title,
    price: e.price ? toInputString(e.price, lang) : '',
    date: e.date,
    qty: num(e.qty, lang),
    unit: e.unit ?? '',
    category: e.category,
  }
}

export function adToForm(a: AdInput, lang: Lang): AdForm {
  return { title: a.title, channel: a.channel, cost: a.cost ? toInputString(a.cost, lang) : '', date: a.date, notes: a.notes ?? '' }
}
