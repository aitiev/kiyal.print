import { create } from 'zustand'
import { DEFAULT_SORT, EMPTY_FILTER, type OrderFilter, type OrderSort } from '@/lib/orderQuery'

interface OrdersUIState {
  filter: OrderFilter
  sort: OrderSort
  setFilter: (patch: Partial<OrderFilter>) => void
  resetFilters: () => void
  setSort: (s: OrderSort) => void
  filtersOpen: boolean
  setFiltersOpen: (v: boolean) => void
  /** Order id awaiting the "how much was received" prompt (half payment). */
  halfPromptId: string | null
  setHalfPromptId: (id: string | null) => void
}

/** Orders list UI state (kept across tab switches for the session). */
export const useOrdersUI = create<OrdersUIState>((set) => ({
  filter: EMPTY_FILTER,
  sort: DEFAULT_SORT,
  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),
  resetFilters: () => set((s) => ({ filter: { ...EMPTY_FILTER, search: s.filter.search } })),
  setSort: (sort) => set({ sort }),
  filtersOpen: false,
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
  halfPromptId: null,
  setHalfPromptId: (halfPromptId) => set({ halfPromptId }),
}))
