import { motion } from 'framer-motion'
import { ArrowRight, Check, Wallet } from 'lucide-react'
import { memo } from 'react'
import type { Order } from '@/db/types'
import { Chip } from '@/components/Chip'
import { toneSoft } from '@/components/tone'
import { cn } from '@/lib/cn'
import { nextWorkStatus } from '@/lib/defaults'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { DueBadge } from './DueBadge'
import { paymentTone, productEmoji, productTone, workTone } from './meta'

interface Props {
  order: Order
  onOpen: (o: Order) => void
  onCyclePayment: (o: Order) => void
  onAdvance: (o: Order) => void
}

export const OrderCard = memo(function OrderCard({ order: o, onOpen, onCyclePayment, onAdvance }: Props) {
  const { t } = useT()
  const money = useMoney()
  const next = nextWorkStatus(o.workStatus)
  const delivered = o.workStatus === 'delivered'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className={cn('flex flex-col overflow-hidden rounded-card bg-surface shadow-soft', delivered && 'opacity-80')}
    >
      <button
        type="button"
        onClick={() => onOpen(o)}
        aria-label={t('orders.a11y.open', { name: o.childName })}
        className="flex items-start gap-3 p-4 pb-3 text-left active:bg-surface-2/60"
      >
        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl', toneSoft[productTone[o.product]])} aria-hidden>
          {productEmoji[o.product]}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-lg font-extrabold">{o.childName}</span>
            <span className="tabular shrink-0 text-lg font-extrabold">{money(o.price)}</span>
          </span>
          <span className="truncate text-sm font-semibold text-muted">
            {o.topic} · {t(`orders.productShort.${o.product}`)}
            {o.extraPages > 0 && ` · +${o.extraPages}`}
          </span>
          <span className="flex flex-wrap gap-1.5 pt-1.5">
            {!delivered && <Chip tone={workTone[o.workStatus]}>{t(`orders.work.${o.workStatus}`)}</Chip>}
            <DueBadge order={o} />
          </span>
        </span>
      </button>

      <div className="flex items-center gap-2 border-t border-line px-3 py-2">
        <button
          type="button"
          onClick={() => onCyclePayment(o)}
          aria-label={t('orders.a11y.changePayment', { status: t(`orders.payment.${o.paymentStatus}`) })}
          className={cn('flex min-h-11 min-w-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-bold active:scale-95', toneSoft[paymentTone[o.paymentStatus]])}
        >
          <Wallet size={16} strokeWidth={2.5} />
          {t(`orders.payment.${o.paymentStatus}`)}
          {o.paymentStatus === 'half' && <span className="tabular opacity-80">· {money(o.amountReceived)}</span>}
        </button>
        <span className="flex-1" />
        {next ? (
          <button
            type="button"
            onClick={() => onAdvance(o)}
            aria-label={t('orders.a11y.advance', { status: t(`orders.work.${next}`) })}
            className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-2 px-4 text-sm font-bold active:scale-95"
          >
            {t(`orders.workNext.${o.workStatus}`)}
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        ) : (
          <span className="flex min-h-11 items-center gap-1 px-3 text-sm font-bold text-muted">
            <Check size={16} strokeWidth={3} /> {t('orders.work.delivered')}
          </span>
        )}
      </div>
    </motion.article>
  )
})
