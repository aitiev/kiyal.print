import { create } from 'zustand'
import type { Period } from '@/lib/dates'

export type Tab = 'dashboard' | 'orders' | 'expenses' | 'settings'
export const TABS: Tab[] = ['dashboard', 'orders', 'expenses', 'settings']

export type ExpensesView = 'expenses' | 'ads'

/** Which editor sheet is open. `id` = edit existing, absent = create. */
export type SheetState =
  | { kind: 'order'; id?: string }
  | { kind: 'expense'; id?: string }
  | { kind: 'ad'; id?: string }
  | null

export interface Toast {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
  duration: number
}

export interface ConfirmRequest {
  title: string
  body?: string
  confirmLabel?: string
  danger?: boolean
  resolve: (ok: boolean) => void
}

function tabFromHash(): Tab {
  const h = location.hash.replace('#/', '').replace('#', '') as Tab
  return TABS.includes(h) ? h : 'dashboard'
}

interface UIState {
  tab: Tab
  setTab: (t: Tab) => void
  /** Dashboard period. */
  period: Period
  setPeriod: (p: Period) => void
  expensesView: ExpensesView
  setExpensesView: (v: ExpensesView) => void
  sheet: SheetState
  openSheet: (s: NonNullable<SheetState>) => void
  closeSheet: () => void
  toasts: Toast[]
  confirm: ConfirmRequest | null
  /** Number of open sheets/dialogs (toasts move to the top while > 0). */
  sheetDepth: number
}

let toastSeq = 1

export const useUI = create<UIState>((set) => ({
  tab: tabFromHash(),
  setTab: (tab) => {
    if (location.hash !== `#/${tab}`) history.replaceState(null, '', `#/${tab}`)
    set({ tab })
  },
  period: 'this_month',
  setPeriod: (period) => set({ period }),
  expensesView: 'expenses',
  setExpensesView: (expensesView) => set({ expensesView }),
  sheet: null,
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
  toasts: [],
  confirm: null,
  sheetDepth: 0,
}))

/** Show a toast. Returns its id. */
export function toast(t: Omit<Toast, 'id' | 'duration'> & { duration?: number }): number {
  const id = toastSeq++
  const item: Toast = { duration: t.actionLabel ? 6000 : 3000, ...t, id }
  useUI.setState((s) => ({ toasts: [...s.toasts.slice(-2), item] }))
  return id
}
export function dismissToast(id: number) {
  useUI.setState((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }))
}

/** Promise-based confirmation dialog. */
export function confirmDialog(req: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    useUI.setState({
      confirm: {
        ...req,
        resolve: (ok) => {
          useUI.setState({ confirm: null })
          resolve(ok)
        },
      },
    })
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => useUI.setState({ tab: tabFromHash() }))
}
