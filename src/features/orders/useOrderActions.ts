import { useCallback } from 'react'
import { ordersRepo, type Order } from '@/db'
import { nextPaymentStatus, paymentStatusFor } from '@/lib/defaults'
import { useT } from '@/hooks/useT'
import { confirmDialog, toast } from '@/store/ui'
import { useOrdersUI } from '@/store/orders'

/** Quick actions shared by the list, the form and the dashboard. Every change can be undone. */
export function useOrderActions() {
  const { t } = useT()
  const setHalfPromptId = useOrdersUI((s) => s.setHalfPromptId)

  const undoable = useCallback(
    (message: string, prev: Order) =>
      toast({ message, actionLabel: t('common.undo'), onAction: () => void ordersRepo.restore(prev) }),
    [t],
  )

  /** unpaid → half (asks for the amount) → paid → unpaid */
  const cyclePayment = useCallback(
    async (o: Order) => {
      const next = nextPaymentStatus(o.paymentStatus)
      if (next === 'half') return setHalfPromptId(o.id)
      const updated = await ordersRepo.setPayment(o.id, next)
      if (updated) undoable(t('orders.toast.payment', { status: t(`orders.payment.${next}`) }), o)
    },
    [setHalfPromptId, t, undoable],
  )

  /** Saves a custom received amount; status is inferred (0 → unpaid, full → paid). */
  const setReceived = useCallback(
    async (o: Order, amount: number) => {
      const status = paymentStatusFor(o.price, amount)
      const updated = await ordersRepo.setPayment(o.id, status, amount)
      if (updated) undoable(t('orders.toast.payment', { status: t(`orders.payment.${status}`) }), o)
    },
    [t, undoable],
  )

  const advanceWork = useCallback(
    async (o: Order) => {
      const updated = await ordersRepo.advanceWork(o.id)
      if (updated) undoable(t('orders.toast.work', { status: t(`orders.work.${updated.workStatus}`) }), o)
    },
    [t, undoable],
  )

  /** Confirms, deletes, and offers undo. Resolves true if deleted. */
  const remove = useCallback(
    async (o: Order): Promise<boolean> => {
      const ok = await confirmDialog({
        title: t('orders.form.deleteTitle'),
        body: t('orders.form.deleteBody', { name: o.childName }),
        confirmLabel: t('common.delete'),
        danger: true,
      })
      if (!ok) return false
      const removed = await ordersRepo.remove(o.id)
      if (removed) toast({ message: t('orders.toast.deleted'), actionLabel: t('common.undo'), onAction: () => void ordersRepo.restore(removed) })
      return true
    },
    [t],
  )

  return { cyclePayment, setReceived, advanceWork, remove }
}
