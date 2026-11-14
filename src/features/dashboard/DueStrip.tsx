import { motion } from 'framer-motion'
import type { DueItem } from '@/lib/stats'
import { DueBadge } from '@/features/orders/DueBadge'
import { useT } from '@/hooks/useT'
import { useUI } from '@/store/ui'

/** Horizontal strip of overdue and soon-due orders; tapping one opens it. Hidden when empty. */
export function DueStrip({ items }: { items: DueItem[] }) {
  const { t } = useT()
  const openSheet = useUI((s) => s.openSheet)
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-2" data-testid="due-strip">
      <h2 className="px-1 font-extrabold">{t('dashboard.due.title')}</h2>
      <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:scroll-px-8 md:px-8 [scrollbar-width:none]">
        {items.map(({ order }) => (
          <motion.button
            key={order.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => openSheet({ kind: 'order', id: order.id })}
            aria-label={t('orders.a11y.open', { name: order.childName })}
            className="flex w-44 shrink-0 snap-start flex-col items-start gap-2 rounded-card bg-surface p-3 text-left shadow-soft"
          >
            <div className="w-full min-w-0">
              <div className="truncate font-extrabold">{order.childName}</div>
              <div className="truncate text-xs font-semibold text-muted">{order.topic || t(`orders.product.${order.product}`)}</div>
            </div>
            <DueBadge order={order} />
          </motion.button>
        ))}
      </div>
    </section>
  )
}
