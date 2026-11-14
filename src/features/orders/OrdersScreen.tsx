import { AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useDeferredValue, useMemo } from 'react'
import { Page } from '@/components/Page'
import { EmptyState } from '@/components/EmptyState'
import { SkeletonList } from '@/components/Skeleton'
import { Button } from '@/components/Button'
import { Chip } from '@/components/Chip'
import { useOrders } from '@/db/hooks'
import { WORK_STATUSES, type Order, type WorkStatus } from '@/db/types'
import { activeFilterCount, queryOrders } from '@/lib/orderQuery'
import { useT } from '@/hooks/useT'
import { useOrdersUI } from '@/store/orders'
import { useUI } from '@/store/ui'
import { OrderCard } from './OrderCard'
import { OrderFilterSheet } from './OrderFilterSheet'
import { useOrderActions } from './useOrderActions'
import { workTone } from './meta'

export function OrdersScreen() {
  const { t, tp } = useT()
  const orders = useOrders()
  const { filter, sort, setFilter, resetFilters, setFiltersOpen } = useOrdersUI()
  const openSheet = useUI((s) => s.openSheet)
  const { cyclePayment, advanceWork } = useOrderActions()

  const search = useDeferredValue(filter.search)
  const visible = useMemo(() => (orders ? queryOrders(orders, { ...filter, search }, sort) : []), [orders, filter, search, sort])
  const workCounts = useMemo(() => {
    const c: Record<WorkStatus, number> = { new: 0, in_progress: 0, ready: 0, delivered: 0 }
    for (const o of orders ?? []) c[o.workStatus]++
    return c
  }, [orders])

  const onOpen = useCallback((o: Order) => openSheet({ kind: 'order', id: o.id }), [openSheet])
  const onCycle = useCallback((o: Order) => void cyclePayment(o), [cyclePayment])
  const onAdvance = useCallback((o: Order) => void advanceWork(o), [advanceWork])

  const active = activeFilterCount(filter)
  const total = orders?.length ?? 0
  const subtitle = orders === undefined ? t('common.loading') : visible.length === total ? tp('orders.count', total) : `${visible.length} / ${tp('orders.count', total)}`

  return (
    <Page
      title={t('orders.title')}
      subtitle={subtitle}
      actions={
        total > 0 && (
          <Button data-testid="filters" variant="secondary" size="sm" onClick={() => setFiltersOpen(true)} icon={<SlidersHorizontal size={18} />} className="relative">
            <span className="hidden sm:inline">{t('orders.filtersButton')}</span>
            <span className="sr-only sm:hidden">{t('orders.filtersButton')}</span>
            {active > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-peach px-1 text-[11px] font-extrabold text-on-accent">{active}</span>
            )}
          </Button>
        )
      }
    >
      {total > 0 && (
        <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-bg/85 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-lg md:-mx-8 md:px-8">
          <label className="relative block">
            <span className="sr-only">{t('common.search')}</span>
            <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              enterKeyHint="search"
              value={filter.search}
              onChange={(e) => setFilter({ search: e.target.value })}
              placeholder={t('orders.searchPlaceholder')}
              className="min-h-12 w-full rounded-2xl bg-surface pl-12 pr-12 font-semibold shadow-soft outline-none ring-2 ring-transparent placeholder:text-muted/70 focus:ring-lavender/60 [&::-webkit-search-cancel-button]:hidden"
            />
            {filter.search && (
              <button
                type="button"
                onClick={() => setFilter({ search: '' })}
                aria-label={t('orders.clearSearch')}
                className="absolute right-0.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-muted"
              >
                <X size={18} />
              </button>
            )}
          </label>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            <Chip selected={filter.work.length === 0} onClick={() => setFilter({ work: [] })}>
              {t('orders.all')} · {total}
            </Chip>
            {WORK_STATUSES.map((w) => (
              <Chip key={w} tone={workTone[w]} selected={filter.work.length === 1 && filter.work[0] === w} onClick={() => setFilter({ work: filter.work.length === 1 && filter.work[0] === w ? [] : [w] })}>
                {t(`orders.work.${w}`)} · {workCounts[w]}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {orders === undefined ? (
        <SkeletonList rows={4} />
      ) : total === 0 ? (
        <EmptyState
          emoji="🎨"
          title={t('orders.emptyTitle')}
          body={t('orders.empty')}
          action={<Button onClick={() => openSheet({ kind: 'order' })}>{t('fab.newOrder')}</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title={t('orders.noResults')}
          body={t('orders.noResultsBody')}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                resetFilters()
                setFilter({ search: '' })
              }}
            >
              {t('orders.resetFilters')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((o) => (
              <OrderCard key={o.id} order={o} onOpen={onOpen} onCyclePayment={onCycle} onAdvance={onAdvance} />
            ))}
          </AnimatePresence>
        </div>
      )}
      <OrderFilterSheet resultCount={visible.length} />
    </Page>
  )
}
