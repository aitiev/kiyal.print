import { Coins, PiggyBank, ShoppingBag, Wallet } from 'lucide-react'
import { Page } from '@/components/Page'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { useT } from '@/hooks/useT'
import { useUI } from '@/store/ui'

// Phase 1 placeholder. Phase 5 replaces it with the real dashboard.
export function DashboardScreen() {
  const { t } = useT()
  const openSheet = useUI((s) => s.openSheet)
  return (
    <Page title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('tabs.orders')} value="—" icon={<ShoppingBag size={18} />} tone="peach" />
        <StatCard label={t("tabs.expenses")} value="—" icon={<Coins size={18} />} tone="mint" />
        <StatCard label="—" value="—" icon={<Wallet size={18} />} tone="lavender" />
        <StatCard label="—" value="—" icon={<PiggyBank size={18} />} tone="sun" />
      </div>
      <EmptyState
        emoji="📒"
        title={t('common.comingSoon')}
        body={t('dashboard.empty')}
        action={<Button onClick={() => openSheet({ kind: 'demo' })}>{t('fab.newOrder')}</Button>}
      />
    </Page>
  )
}
