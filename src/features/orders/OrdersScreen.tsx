import { Page } from '@/components/Page'
import { EmptyState } from '@/components/EmptyState'
import { useT } from '@/hooks/useT'

// Phase 1 placeholder. Phase 3 implements the list.
export function OrdersScreen() {
  const { t, tp } = useT()
  return (
    <Page title={t('orders.title')} subtitle={tp('orders.count', 0)}>
      <EmptyState emoji="🎨" title={t('common.comingSoon')} body={t('orders.empty')} />
    </Page>
  )
}
