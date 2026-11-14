import type { Ad, Expense, Order } from '@/db/types'

let n = 0
export function order(p: Partial<Order> = {}): Order {
  n++
  return {
    id: `o${n}`,
    childName: 'Айлин',
    product: 'colouring_book',
    topic: 'Динозавры',
    price: 80000,
    extraPages: 0,
    gift: 'Sticker',
    paymentStatus: 'unpaid',
    amountReceived: 0,
    workStatus: 'new',
    createdAt: new Date(2026, 10, 10, 12).getTime(),
    updatedAt: new Date(2026, 10, 10, 12).getTime(),
    ...p,
  }
}
export function expense(p: Partial<Expense> = {}): Expense {
  n++
  return { id: `e${n}`, title: 'Бумага', price: 65000, date: '2026-11-05', category: 'paper', createdAt: 1, updatedAt: 1, ...p }
}
export function ad(p: Partial<Ad> = {}): Ad {
  n++
  return { id: `a${n}`, title: 'Target', channel: 'Instagram', cost: 150000, date: '2026-11-03', createdAt: 1, updatedAt: 1, ...p }
}
