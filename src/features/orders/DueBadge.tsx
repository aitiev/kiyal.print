import { CalendarClock } from 'lucide-react'
import { Chip } from '@/components/Chip'
import type { Order } from '@/db/types'
import { daysUntil, formatDate } from '@/lib/dates'
import { dueState } from '@/lib/stats'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'

/** Due-date badge: red when overdue, yellow today, peach soon, neutral date later. */
export function DueBadge({ order }: { order: Pick<Order, 'dueDate' | 'workStatus'> }) {
  const { t, tp, lang } = useT()
  const now = useToday()
  const state = dueState(order, now)
  if (state === 'none' || state === 'done' || !order.dueDate) return null
  const days = daysUntil(order.dueDate, now)
  const icon = <CalendarClock size={14} strokeWidth={2.5} />
  switch (state) {
    case 'overdue':
      return <Chip tone="danger" icon={icon}>{tp('orders.due.overdue', -days)}</Chip>
    case 'today':
      return <Chip tone="sun" icon={icon}>{t('orders.due.today')}</Chip>
    case 'soon':
      return <Chip tone="peach" icon={icon}>{days === 1 ? t('orders.due.tomorrow') : tp('orders.due.in', days)}</Chip>
    default:
      return <Chip tone="neutral" icon={icon}>{t('orders.due.on', { date: formatDate(order.dueDate, lang, now) })}</Chip>
  }
}
