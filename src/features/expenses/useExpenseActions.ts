import { useCallback } from 'react'
import { adsRepo, expensesRepo, type Ad, type Expense } from '@/db'
import { useT } from '@/hooks/useT'
import { confirmDialog, toast } from '@/store/ui'

/** Delete with confirmation + undo for expenses and ads. Resolve true when deleted. */
export function useExpenseActions() {
  const { t } = useT()

  const removeExpense = useCallback(
    async (e: Expense) => {
      const ok = await confirmDialog({
        title: t('expenses.form.deleteTitle'),
        body: t('expenses.form.deleteBody', { name: e.title }),
        confirmLabel: t('common.delete'),
        danger: true,
      })
      if (!ok) return false
      const removed = await expensesRepo.remove(e.id)
      if (removed) toast({ message: t('expenses.toast.deleted'), actionLabel: t('common.undo'), onAction: () => void expensesRepo.restore(removed) })
      return true
    },
    [t],
  )

  const removeAd = useCallback(
    async (a: Ad) => {
      const ok = await confirmDialog({
        title: t('expenses.adForm.deleteTitle'),
        body: t('expenses.adForm.deleteBody', { name: a.title }),
        confirmLabel: t('common.delete'),
        danger: true,
      })
      if (!ok) return false
      const removed = await adsRepo.remove(a.id)
      if (removed) toast({ message: t('expenses.toast.adDeleted'), actionLabel: t('common.undo'), onAction: () => void adsRepo.restore(removed) })
      return true
    },
    [t],
  )

  return { removeExpense, removeAd }
}
