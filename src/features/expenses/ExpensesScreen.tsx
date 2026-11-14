import { AnimatePresence } from 'framer-motion'
import { useCallback, useMemo } from 'react'
import { Page } from '@/components/Page'
import { EmptyState } from '@/components/EmptyState'
import { SegmentedControl } from '@/components/SegmentedControl'
import { SkeletonList } from '@/components/Skeleton'
import { Button } from '@/components/Button'
import { Chip } from '@/components/Chip'
import { useAds, useExpenses } from '@/db/hooks'
import { EXPENSE_CATEGORIES, type Ad, type Expense } from '@/db/types'
import { formatMonth } from '@/lib/dates'
import { sumMinor } from '@/lib/money'
import { categoryTotals, groupByMonth, type MonthGroup } from '@/lib/stats'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { useUI } from '@/store/ui'
import { AdCard, ExpenseCard } from './ExpenseCard'
import { categoryFill, categoryTone } from './meta'

function MonthHeader({ month, total }: { month: string; total: number }) {
  const { lang } = useT()
  const money = useMoney()
  return (
    <div className="sticky top-0 z-10 -mx-4 flex items-baseline justify-between gap-3 bg-bg/85 px-5 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-lg md:-mx-8 md:px-9">
      <h2 className="text-lg font-black">{formatMonth(month, lang)}</h2>
      <span className="tabular font-extrabold text-muted">{money(total)}</span>
    </div>
  )
}

function CategoryTotals({ items }: { items: Expense[] }) {
  const { t } = useT()
  const money = useMoney()
  const totals = categoryTotals(items)
  const sum = sumMinor(Object.values(totals))
  const present = EXPENSE_CATEGORIES.filter((c) => totals[c] > 0)
  if (present.length === 0) return null
  return (
    <div className="flex flex-col gap-2 pb-3">
      {/* proportional bar */}
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        {present.map((c) => (
          <span key={c} className={`h-full ${categoryFill[c]}`} style={{ width: `${(totals[c] / sum) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {present.map((c) => (
          <Chip key={c} tone={categoryTone[c]}>
            {`${t(`expenses.category.${c}`)} · ${money(totals[c])}`}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function Groups<T extends { id: string }>({ groups, render, header }: { groups: MonthGroup<T>[]; render: (row: T) => React.ReactNode; header?: (g: MonthGroup<T>) => React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((g) => (
        <section key={g.month} aria-label={g.month}>
          <MonthHeader month={g.month} total={g.total} />
          {header?.(g)}
          <ul className="grid gap-2.5 md:grid-cols-2">
            <AnimatePresence initial={false} mode="popLayout">
              {g.items.map(render)}
            </AnimatePresence>
          </ul>
        </section>
      ))}
    </div>
  )
}

export function ExpensesScreen() {
  const { t } = useT()
  const money = useMoney()
  const view = useUI((s) => s.expensesView)
  const setView = useUI((s) => s.setExpensesView)
  const openSheet = useUI((s) => s.openSheet)
  const expenses = useExpenses()
  const ads = useAds()

  const expenseGroups = useMemo(() => groupByMonth(expenses ?? [], (e) => e.price), [expenses])
  const adGroups = useMemo(() => groupByMonth(ads ?? [], (a) => a.cost), [ads])
  const openExpense = useCallback((e: Expense) => openSheet({ kind: 'expense', id: e.id }), [openSheet])
  const openAd = useCallback((a: Ad) => openSheet({ kind: 'ad', id: a.id }), [openSheet])

  const rows = view === 'expenses' ? expenses : ads
  const total = view === 'expenses' ? sumMinor((expenses ?? []).map((e) => e.price)) : sumMinor((ads ?? []).map((a) => a.cost))

  return (
    <Page title={t('expenses.title')} subtitle={rows?.length ? t('expenses.subtitleTotal', { amount: money(total) }) : undefined}>
      <SegmentedControl
        className="mb-2"
        ariaLabel={t('expenses.title')}
        value={view}
        onChange={setView}
        options={[
          { value: 'expenses', label: t('expenses.tabExpenses') },
          { value: 'ads', label: t('expenses.tabAds') },
        ]}
      />

      {rows === undefined ? (
        <div className="pt-4">
          <SkeletonList rows={5} />
        </div>
      ) : rows.length === 0 ? (
        view === 'expenses' ? (
          <EmptyState
            emoji="🧾"
            title={t('expenses.emptyTitle')}
            body={t('expenses.empty')}
            action={<Button onClick={() => openSheet({ kind: 'expense' })}>{t('fab.newExpense')}</Button>}
          />
        ) : (
          <EmptyState
            emoji="📣"
            title={t('expenses.adsEmptyTitle')}
            body={t('expenses.adsEmpty')}
            action={<Button onClick={() => openSheet({ kind: 'ad' })}>{t('fab.newAd')}</Button>}
          />
        )
      ) : view === 'expenses' ? (
        <Groups groups={expenseGroups} header={(g) => <CategoryTotals items={g.items} />} render={(e) => <ExpenseCard key={e.id} expense={e} onOpen={openExpense} />} />
      ) : (
        <Groups groups={adGroups} render={(a) => <AdCard key={a.id} ad={a} onOpen={openAd} />} />
      )}
    </Page>
  )
}
