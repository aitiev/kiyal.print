/** Live-query hooks: return `undefined` while loading, then re-render on every DB change. */
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './schema'
import { adsRepo } from './repositories/ads'
import { expensesRepo } from './repositories/expenses'
import { goalsRepo } from './repositories/goals'
import { ordersRepo } from './repositories/orders'
import type { Dataset } from '@/lib/stats'

export const useOrders = () => useLiveQuery(() => ordersRepo.list(), [])
export const useOrder = (id: string | undefined) => useLiveQuery(() => (id ? db.orders.get(id) : undefined), [id])
export const useExpenses = () => useLiveQuery(() => expensesRepo.list(), [])
export const useExpense = (id: string | undefined) => useLiveQuery(() => (id ? db.expenses.get(id) : undefined), [id])
export const useAds = () => useLiveQuery(() => adsRepo.list(), [])
export const useAd = (id: string | undefined) => useLiveQuery(() => (id ? db.ads.get(id) : undefined), [id])
export const useGoals = () => useLiveQuery(() => goalsRepo.list(), [])

/** Everything the dashboard needs, in one consistent read. */
export const useDataset = (): Dataset | undefined =>
  useLiveQuery(
    () =>
      db.transaction('r', db.orders, db.expenses, db.ads, async () => ({
        orders: await db.orders.toArray(),
        expenses: await db.expenses.toArray(),
        ads: await db.ads.toArray(),
      })),
    [],
  )
