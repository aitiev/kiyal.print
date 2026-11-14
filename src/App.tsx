import { AnimatePresence, MotionConfig } from 'framer-motion'
import { BottomNav } from '@/components/BottomNav'
import { Fab } from '@/components/Fab'
import { Toaster } from '@/components/Toaster'
import { ConfirmHost } from '@/components/ConfirmHost'
import { DashboardScreen } from '@/features/dashboard/DashboardScreen'
import { OrdersScreen } from '@/features/orders/OrdersScreen'
import { ExpensesScreen } from '@/features/expenses/ExpensesScreen'
import { SettingsScreen } from '@/features/settings/SettingsScreen'
import { OrderFormSheet } from '@/features/orders/OrderFormSheet'
import { HalfPaymentSheet } from '@/features/orders/HalfPaymentSheet'
import { ExpenseFormSheet } from '@/features/expenses/ExpenseFormSheet'
import { AdFormSheet } from '@/features/expenses/AdFormSheet'
import { useApplyPrefs } from '@/hooks/useTheme'
import { useT } from '@/hooks/useT'
import { useUI } from '@/store/ui'
import { useLock } from '@/store/lock'
import { LockScreen } from '@/features/lock/LockScreen'

export default function App() {
  useApplyPrefs()
  const { t } = useT()
  const tab = useUI((s) => s.tab)
  const expensesView = useUI((s) => s.expensesView)
  const openSheet = useUI((s) => s.openSheet)
  const lock = useLock((s) => s.status)

  const fab =
    tab === 'orders' || tab === 'dashboard'
      ? { label: t('fab.newOrder'), run: () => openSheet({ kind: 'order' }) }
      : tab === 'expenses'
        ? expensesView === 'ads'
          ? { label: t('fab.newAd'), run: () => openSheet({ kind: 'ad' }) }
          : { label: t('fab.newExpense'), run: () => openSheet({ kind: 'expense' }) }
        : null

  // Don't paint any data until we know whether a PIN is required.
  if (lock === 'checking') return null

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-dvh pl-safe pr-safe md:pl-[calc(7rem+env(safe-area-inset-left))]">
      <AnimatePresence mode="wait">
        {tab === 'dashboard' && <DashboardScreen key="d" />}
        {tab === 'orders' && <OrdersScreen key="o" />}
        {tab === 'expenses' && <ExpensesScreen key="e" />}
        {tab === 'settings' && <SettingsScreen key="s" />}
      </AnimatePresence>
      <BottomNav />
      <Fab visible={!!fab} label={fab?.label ?? ''} onClick={() => fab?.run()} />
      <OrderFormSheet />
      <HalfPaymentSheet />
      <ExpenseFormSheet />
      <AdFormSheet />
      <ConfirmHost />
      <Toaster />
      {lock === 'locked' && <LockScreen />}
    </div>
    </MotionConfig>
  )
}
