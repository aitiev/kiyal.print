import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import { Sheet } from '@/components/Sheet'
import { Button } from '@/components/Button'
import { Chip } from '@/components/Chip'
import { Field, TextInput } from '@/components/Field'
import { PAYMENT_STATUSES, PRODUCTS, WORK_STATUSES } from '@/db/types'
import { activeFilterCount, type OrderSortKey } from '@/lib/orderQuery'
import { useT } from '@/hooks/useT'
import { useOrdersUI } from '@/store/orders'
import { paymentTone, productTone, workTone } from './meta'

const SORT_KEYS: OrderSortKey[] = ['created', 'due', 'price', 'name']

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="px-1 pb-2 text-sm font-bold text-muted">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

export function OrderFilterSheet({ resultCount }: { resultCount: number }) {
  const { t, tp } = useT()
  const { filter, sort, setFilter, setSort, resetFilters, filtersOpen, setFiltersOpen } = useOrdersUI()
  const close = () => setFiltersOpen(false)
  const active = activeFilterCount(filter)

  return (
    <Sheet
      open={filtersOpen}
      onClose={close}
      title={t('orders.filtersTitle')}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="whitespace-nowrap" onClick={resetFilters} disabled={active === 0}>
            {t('orders.resetFilters')}
          </Button>
          <Button block onClick={close}>
            {t('orders.showResults')} · {tp('orders.count', resultCount)}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        <Group title={t('orders.sortBy')}>
          {SORT_KEYS.map((k) => (
            <Chip key={k} selected={sort.key === k} onClick={() => setSort({ ...sort, key: k })}>
              {t(`orders.sort.${k}`)}
            </Chip>
          ))}
          <Chip
            selected
            tone="neutral"
            onClick={() => setSort({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
            icon={sort.dir === 'asc' ? <ArrowUpNarrowWide size={16} /> : <ArrowDownWideNarrow size={16} />}
          >
            {t(sort.dir === 'asc' ? 'orders.asc' : 'orders.desc')}
          </Chip>
        </Group>
        <Group title={t('orders.form.payment')}>
          {PAYMENT_STATUSES.map((p) => (
            <Chip key={p} tone={paymentTone[p]} selected={filter.payment.includes(p)} onClick={() => setFilter({ payment: toggle(filter.payment, p) })}>
              {t(`orders.payment.${p}`)}
            </Chip>
          ))}
        </Group>
        <Group title={t('orders.form.work')}>
          {WORK_STATUSES.map((w) => (
            <Chip key={w} tone={workTone[w]} selected={filter.work.includes(w)} onClick={() => setFilter({ work: toggle(filter.work, w) })}>
              {t(`orders.work.${w}`)}
            </Chip>
          ))}
        </Group>
        <Group title={t('orders.form.product')}>
          {PRODUCTS.map((p) => (
            <Chip key={p} tone={productTone[p]} selected={filter.product.includes(p)} onClick={() => setFilter({ product: toggle(filter.product, p) })}>
              {t(`orders.product.${p}`)}
            </Chip>
          ))}
        </Group>
        <fieldset>
          <legend className="px-1 pb-2 text-sm font-bold text-muted">{t('orders.dueRange')}</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('orders.dueFrom')}>
              {(id) => (
                <TextInput id={id} type="date" value={filter.dueFrom ?? ''} max={filter.dueTo ?? undefined} onChange={(e) => setFilter({ dueFrom: e.target.value || null })} />
              )}
            </Field>
            <Field label={t('orders.dueTo')}>
              {(id) => (
                <TextInput id={id} type="date" value={filter.dueTo ?? ''} min={filter.dueFrom ?? undefined} onChange={(e) => setFilter({ dueTo: e.target.value || null })} />
              )}
            </Field>
          </div>
        </fieldset>
      </div>
    </Sheet>
  )
}
