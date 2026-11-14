import { Coins, Hourglass, Megaphone, PiggyBank, Receipt, ShoppingBag, Sparkles, Wallet } from 'lucide-react'
import { lazy, Suspense, useMemo } from 'react'
import { Page } from '@/components/Page'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Skeleton } from '@/components/Skeleton'
import { useDataset, useGoals } from '@/db/hooks'
import { PERIODS, periodRange } from '@/lib/dates'
import { roundToMajor } from '@/lib/money'
import { dueSoon, filterDataset, incomeCostSeries, summarize, type Dataset } from '@/lib/stats'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { useUI } from '@/store/ui'
import { useOrdersUI } from '@/store/orders'
import { BreakEvenCard, IncomeGoalCard } from './GoalCards'
import { DueStrip } from './DueStrip'

// Recharts is heavy: load it in its own chunk (still precached for offline use).
const IncomeChart = lazy(() => import('./IncomeChart').then((m) => ({ default: m.IncomeChart })))

export function DashboardScreen() {
  const { t } = useT()
  const data = useDataset()
  const isEmpty = data && data.orders.length === 0 && data.expenses.length === 0 && data.ads.length === 0
  return (
    <Page title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
      {!data ? <DashboardSkeleton /> : isEmpty ? <DashboardEmpty /> : <DashboardContent data={data} />}
    </Page>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <Skeleton className="h-12" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}

function DashboardEmpty() {
  const { t } = useT()
  const openSheet = useUI((s) => s.openSheet)
  const setTab = useUI((s) => s.setTab)
  return (
    <EmptyState
      emoji="📒"
      title={t('dashboard.emptyTitle')}
      body={t('dashboard.empty')}
      action={
        <div className="flex flex-col items-center gap-2">
          <Button onClick={() => openSheet({ kind: 'order' })}>{t('fab.newOrder')}</Button>
          <Button variant="ghost" icon={<Sparkles size={18} />} onClick={() => setTab('settings')}>
            {t('dashboard.tryDemo')}
          </Button>
        </div>
      }
    />
  )
}

function DashboardContent({ data }: { data: Dataset }) {
  const { t, tp } = useT()
  const money = useMoney()
  const now = useToday()
  const period = useUI((s) => s.period)
  const setPeriod = useUI((s) => s.setPeriod)
  const setTab = useUI((s) => s.setTab)
  const goals = useGoals()

  const view = useMemo(() => {
    const range = periodRange(period, now)
    const inPeriod = filterDataset(data, range)
    const { overdue, soon } = dueSoon(data.orders, now)
    return {
      summary: summarize(inPeriod),
      pendingCount: inPeriod.orders.filter((o) => o.paymentStatus !== 'paid').length,
      allTime: summarize(data),
      thisMonthReceived: summarize(filterDataset(data, periodRange('this_month', now))).received,
      series: incomeCostSeries(data, range, now),
      due: [...overdue, ...soon],
    }
  }, [data, period, now])

  const s = view.summary
  const goalTarget = goals?.find((g) => g.type === 'monthly_income')?.targetAmount

  const openPending = () => {
    const o = useOrdersUI.getState()
    o.resetFilters()
    o.setFilter({ payment: ['unpaid', 'half'] })
    setTab('orders')
  }

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        ariaLabel={t('dashboard.periodLabel')}
        options={PERIODS.map((p) => ({ value: p, label: t(`dashboard.periodShort.${p}`) }))}
        value={period}
        onChange={setPeriod}
      />

      <DueStrip items={view.due} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="stats">
        <StatCard label={t('dashboard.stat.received')} value={money(s.received)} icon={<Wallet size={18} />} tone="mint" />
        <StatCard
          label={t('dashboard.stat.pending')}
          value={money(s.pending)}
          hint={view.pendingCount > 0 ? tp('orders.count', view.pendingCount) : undefined}
          icon={<Hourglass size={18} />}
          tone="sun"
          onClick={openPending}
        />
        <StatCard label={t('dashboard.stat.orders')} value={s.orderCount} icon={<ShoppingBag size={18} />} tone="peach" />
        <StatCard
          label={t('dashboard.stat.average')}
          value={s.avgOrderValue === null ? '—' : money(roundToMajor(s.avgOrderValue))}
          hint={s.avgOrderValue === null ? t('dashboard.noAverage') : undefined}
          icon={<Receipt size={18} />}
          tone="lavender"
        />
        <StatCard label={t('dashboard.stat.expenses')} value={money(s.expenses)} icon={<Coins size={18} />} tone="peach" />
        <StatCard label={t('dashboard.stat.ads')} value={money(s.ads)} icon={<Megaphone size={18} />} tone="lavender" />
        <StatCard
          className="col-span-2"
          label={t('dashboard.stat.net')}
          value={<span className={s.net < 0 ? 'text-danger' : s.net > 0 ? 'text-mint' : undefined}>{money(s.net)}</span>}
          hint={t('dashboard.netHint')}
          icon={<PiggyBank size={18} />}
          tone={s.net < 0 ? 'danger' : 'mint'}
        />
      </div>

      <Suspense fallback={<Skeleton className="h-72" />}>
        <IncomeChart series={view.series} />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <BreakEvenCard allTime={view.allTime} />
        <IncomeGoalCard target={goalTarget} current={view.thisMonthReceived} />
      </div>
    </div>
  )
}
