import { useState } from 'react'
import { Sheet } from '@/components/Sheet'
import { Button } from '@/components/Button'
import { Field, TextInput } from '@/components/Field'
import { useOrder } from '@/db/hooks'
import type { Order } from '@/db/types'
import { defaultAmountReceived } from '@/lib/defaults'
import { parseMoney, percentOf, toInputString } from '@/lib/money'
import type { MsgKey } from '@/lib/i18n'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { useOrdersUI } from '@/store/orders'
import { useOrderActions } from './useOrderActions'

/** "How much was received?" prompt shown when a quick action switches an order to half payment. */
export function HalfPaymentSheet() {
  const { t } = useT()
  const id = useOrdersUI((s) => s.halfPromptId)
  const setId = useOrdersUI((s) => s.setHalfPromptId)
  const order = useOrder(id ?? undefined)
  const close = () => setId(null)
  return (
    <Sheet open={!!id} onClose={close} title={t('orders.half.title')} size="sm">
      {order && <HalfForm key={order.id} order={order} onDone={close} />}
    </Sheet>
  )
}

function HalfForm({ order, onDone }: { order: Order; onDone: () => void }) {
  const { t, lang } = useT()
  const money = useMoney()
  const { setReceived } = useOrderActions()
  const [value, setValue] = useState(() => toInputString(defaultAmountReceived(order.price, 'half'), lang))
  const [error, setError] = useState<MsgKey>()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseMoney(value)
    if (amount === null) return setError('validation.invalidNumber')
    if (amount > order.price) return setError('validation.exceedsPrice')
    await setReceived(order, amount)
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 pb-2" noValidate>
      <Field label={`${t('orders.form.amountReceived')}, ${money.unit}`} error={error && t(error)} hint={t('orders.half.hint', { price: money(order.price) })}>
        {(id, d, inv) => (
          <TextInput
            id={id}
            aria-describedby={d}
            invalid={inv}
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(undefined)
            }}
          />
        )}
      </Field>
      <div className="flex flex-wrap gap-2">
        {[30, 50, 70].map((p) => (
          <Button key={p} size="sm" variant="secondary" onClick={() => setValue(toInputString(percentOf(order.price, p), lang))}>
            {p}%
          </Button>
        ))}
      </div>
      <Button type="submit" block>
        {t('common.save')}
      </Button>
    </form>
  )
}
