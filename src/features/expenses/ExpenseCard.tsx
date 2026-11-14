import { motion } from 'framer-motion'
import { memo } from 'react'
import type { Ad, Expense } from '@/db/types'
import { toneSoft } from '@/components/tone'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/dates'
import { formatNumber } from '@/lib/money'
import { unitCost } from '@/lib/stats'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { categoryEmoji, categoryTone } from './meta'

const rowMotion = {
  layout: true,
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 34 },
} as const

function Row({ emoji, tone, title, meta, extra, amount, onOpen, label }: {
  emoji: string
  tone: string
  title: string
  meta: string
  extra?: string
  amount: string
  onOpen: () => void
  label: string
}) {
  return (
    <motion.li {...rowMotion}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        className="flex w-full items-center gap-3 rounded-card bg-surface p-3 pr-4 text-left shadow-soft active:bg-surface-2/60"
      >
        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl', tone)} aria-hidden>
          {emoji}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-extrabold">{title}</span>
            <span className="tabular shrink-0 font-extrabold">{amount}</span>
          </span>
          <span className="truncate text-sm font-semibold text-muted">{meta}</span>
          {extra && <span className="truncate text-xs font-bold text-mint">{extra}</span>}
        </span>
      </button>
    </motion.li>
  )
}

export const ExpenseCard = memo(function ExpenseCard({ expense: e, onOpen }: { expense: Expense; onOpen: (e: Expense) => void }) {
  const { t, lang } = useT()
  const money = useMoney()
  const now = useToday()
  const uc = unitCost(e)
  const unit = e.unit || t('expenses.units.pcs')
  const extra =
    e.qty != null
      ? `${t('expenses.qtyUnit', { qty: formatNumber(e.qty, lang), unit: e.unit ?? '' }).trim()}${uc !== null ? ` · ${t('expenses.unitCost', { price: money(uc), unit })}` : ''}`
      : undefined
  return (
    <Row
      emoji={categoryEmoji[e.category]}
      tone={toneSoft[categoryTone[e.category]]}
      title={e.title}
      meta={`${formatDate(e.date, lang, now)} · ${t(`expenses.category.${e.category}`)}`}
      extra={extra}
      amount={money(e.price)}
      onOpen={() => onOpen(e)}
      label={t('expenses.a11y.open', { name: e.title })}
    />
  )
})

export const AdCard = memo(function AdCard({ ad: a, onOpen }: { ad: Ad; onOpen: (a: Ad) => void }) {
  const { t, lang } = useT()
  const money = useMoney()
  const now = useToday()
  return (
    <Row
      emoji="📣"
      tone={toneSoft.peach}
      title={a.title}
      meta={`${formatDate(a.date, lang, now)} · ${a.channel}`}
      extra={a.notes}
      amount={money(a.cost)}
      onOpen={() => onOpen(a)}
      label={t('expenses.a11y.open', { name: a.title })}
    />
  )
})
