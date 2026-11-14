import { Page } from '@/components/Page'
import { EmptyState } from '@/components/EmptyState'
import { SegmentedControl } from '@/components/SegmentedControl'
import { useT } from '@/hooks/useT'
import { useUI } from '@/store/ui'

// Phase 1 placeholder. Phase 4 implements expenses and ads.
export function ExpensesScreen() {
  const { t } = useT()
  const view = useUI((s) => s.expensesView)
  const setView = useUI((s) => s.setExpensesView)
  return (
    <Page title={t('expenses.title')}>
      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: 'expenses', label: t('expenses.tabExpenses') },
          { value: 'ads', label: t('expenses.tabAds') },
        ]}
      />
      <EmptyState emoji="🧾" title={t('common.comingSoon')} body={t('expenses.empty')} />
    </Page>
  )
}
