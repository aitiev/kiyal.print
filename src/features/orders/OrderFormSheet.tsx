import { CalendarX2, ChevronDown, Minus, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { Sheet } from '@/components/Sheet'
import { Button } from '@/components/Button'
import { Chip } from '@/components/Chip'
import { EmptyState } from '@/components/EmptyState'
import { Field, TextArea, TextInput } from '@/components/Field'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Skeleton } from '@/components/Skeleton'
import { ordersRepo } from '@/db'
import { useOrder } from '@/db/hooks'
import { PAYMENT_STATUSES, PRODUCTS, SOURCES, WORK_STATUSES, type Order, type PaymentStatus } from '@/db/types'
import { defaultAmountReceived, defaultDueDate, newOrderDraft, paymentStatusFor } from '@/lib/defaults'
import { orderToForm } from '@/lib/forms'
import { parseMoney, toInputString } from '@/lib/money'
import { parseOrderForm, type Errors, type OrderForm } from '@/lib/validation'
import { cn } from '@/lib/cn'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { toast, useUI } from '@/store/ui'
import { workTone } from './meta'
import { useOrderActions } from './useOrderActions'

const FORM_ID = 'order-form'

/** Create / edit order bottom sheet, driven by `useUI().sheet = {kind:'order', id?}`. */
export function OrderFormSheet() {
  const { t } = useT()
  const sheet = useUI((s) => s.sheet)
  const close = useUI((s) => s.closeSheet)
  const open = sheet?.kind === 'order'
  const id = open ? sheet.id : undefined
  const order = useOrder(id)
  const { remove } = useOrderActions()

  const footer =
    id && order ? (
      <div className="flex gap-3">
        <Button
          variant="danger"
          size="icon"
          className="h-12 w-12 shrink-0"
          aria-label={t('orders.form.deleteOrder')}
          title={t('orders.form.deleteOrder')}
          onClick={async () => (await remove(order)) && close()}
        >
          <Trash2 size={20} />
        </Button>
        <Button type="submit" form={FORM_ID} block>
          {t('common.save')}
        </Button>
      </div>
    ) : !id ? (
      <Button type="submit" form={FORM_ID} block>
        {t('common.save')}
      </Button>
    ) : undefined

  return (
    <Sheet open={open} onClose={close} title={t(id ? 'orders.form.editTitle' : 'orders.form.newTitle')} footer={footer}>
      {id && order === undefined ? (
        <div className="flex flex-col gap-4 pt-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : id && order === null ? (
        <EmptyState emoji="🔍" title={t('orders.form.notFound')} />
      ) : (
        <OrderFormBody key={id ?? 'new'} order={order ?? undefined} onDone={close} />
      )}
    </Sheet>
  )
}

function OrderFormBody({ order, onDone }: { order?: Order; onDone: () => void }) {
  const { t, lang } = useT()
  const money = useMoney()
  const formRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<OrderForm>(() => orderToForm(order ?? newOrderDraft(Date.now(), t('orders.defaultGift')), lang))
  const [errors, setErrors] = useState<Errors<OrderForm>>({})
  const [submitted, setSubmitted] = useState(false)
  const [amountTouched, setAmountTouched] = useState(!!order)
  const [showDetails, setShowDetails] = useState(
    !!order && !!(order.phone || order.notes || order.source || order.extraPages > 0),
  )

  // One update per event, so reading `form` from the closure is safe.
  const update = (patch: Partial<OrderForm>) => {
    const next = { ...form, ...patch }
    setForm(next)
    if (submitted) {
      const r = parseOrderForm(next)
      setErrors(r.ok ? {} : r.errors)
    }
  }
  const err = (k: keyof OrderForm) => (errors[k] ? t(errors[k]!) : undefined)

  const price = parseMoney(form.price)
  const received = parseMoney(form.amountReceived || '0')

  const setPrice = (v: string) => {
    const p = parseMoney(v)
    // Keep amount in sync with the status until the user edits it by hand.
    if (!amountTouched && p !== null) update({ price: v, amountReceived: toInputString(defaultAmountReceived(p, form.paymentStatus), lang) })
    else update({ price: v })
  }
  const setPayment = (s: PaymentStatus) => {
    setAmountTouched(false)
    update({ paymentStatus: s, amountReceived: toInputString(defaultAmountReceived(price ?? 0, s), lang) })
  }
  const onAmountBlur = () => {
    if (price !== null && received !== null && received <= price) {
      const status = paymentStatusFor(price, received)
      if (status !== form.paymentStatus) update({ paymentStatus: status })
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const r = parseOrderForm(form)
    if (!r.ok) {
      setErrors(r.errors)
      if (r.errors.phone || r.errors.extraPages || r.errors.notes || r.errors.gift) setShowDetails(true)
      toast({ message: t('orders.form.fixErrors') })
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    if (order) await ordersRepo.update(order.id, r.value)
    else await ordersRepo.create(r.value)
    toast({ message: t(order ? 'orders.toast.saved' : 'orders.toast.created') })
    onDone()
  }

  const remaining = price !== null && received !== null ? price - received : null

  return (
    <form id={FORM_ID} ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5 pb-4 pt-1">
      <Field label={t('orders.form.childName')} error={err('childName')}>
        {(id, d, inv) => (
          <TextInput
            id={id}
            aria-describedby={d}
            invalid={inv}
            value={form.childName}
            onChange={(e) => update({ childName: e.target.value })}
            placeholder={t('orders.form.childNamePh')}
            autoCapitalize="words"
            autoComplete="off"
            enterKeyHint="next"
          />
        )}
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-sm font-bold text-muted">{t('orders.form.product')}</span>
        <SegmentedControl
          ariaLabel={t('orders.form.product')}
          value={form.product}
          onChange={(product) => update({ product })}
          options={PRODUCTS.map((p) => ({ value: p, label: t(`orders.productShort.${p}`) }))}
        />
      </div>

      <Field label={t('orders.form.topic')} error={err('topic')}>
        {(id, d, inv) => (
          <TextInput
            id={id}
            aria-describedby={d}
            invalid={inv}
            value={form.topic}
            onChange={(e) => update({ topic: e.target.value })}
            placeholder={t('orders.form.topicPh')}
            autoComplete="off"
            enterKeyHint="next"
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
        <Field label={`${t('orders.form.price')}, ${money.unit}`} error={err('price')}>
          {(id, d, inv) => (
            <TextInput
              id={id}
              aria-describedby={d}
              invalid={inv}
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="800"
              className="tabular"
            />
          )}
        </Field>
        <Field label={t('orders.form.dueDate')} error={err('dueDate')}>
          {(id, d, inv) =>
            form.dueDate ? (
              <div className="flex gap-2">
                <TextInput
                  id={id}
                  aria-describedby={d}
                  invalid={inv}
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => update({ dueDate: e.target.value })}
                  className="min-w-0 flex-1"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-2xl text-muted"
                  onClick={() => update({ dueDate: '' })}
                  aria-label={t('orders.form.clearDue')}
                  title={t('orders.form.clearDue')}
                >
                  <CalendarX2 size={18} />
                </Button>
              </div>
            ) : (
              <Button
                id={id}
                variant="secondary"
                block
                className="min-h-12 font-semibold text-muted"
                onClick={() => update({ dueDate: defaultDueDate(order?.createdAt ?? Date.now()) })}
              >
                {t('orders.form.setDue')}
              </Button>
            )
          }
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-sm font-bold text-muted">{t('orders.form.payment')}</span>
        <SegmentedControl
          ariaLabel={t('orders.form.payment')}
          value={form.paymentStatus}
          onChange={setPayment}
          options={PAYMENT_STATUSES.map((p) => ({ value: p, label: t(`orders.payment.${p}`) }))}
        />
      </div>

      <AnimatePresence initial={false}>
        {form.paymentStatus !== 'unpaid' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Field
              label={`${t('orders.form.amountReceived')}, ${money.unit}`}
              error={err('amountReceived')}
              hint={
                remaining !== null && remaining >= 0
                  ? remaining === 0
                    ? t('orders.form.fullyPaid')
                    : t('orders.form.remaining', { amount: money(remaining) })
                  : undefined
              }
            >
              {(id, d, inv) => (
                <TextInput
                  id={id}
                  aria-describedby={d}
                  invalid={inv}
                  inputMode="decimal"
                  value={form.amountReceived}
                  onChange={(e) => {
                    setAmountTouched(true)
                    update({ amountReceived: e.target.value })
                  }}
                  onBlur={onAmountBlur}
                  className="tabular"
                />
              )}
            </Field>
          </motion.div>
        )}
      </AnimatePresence>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="px-1 pb-1.5 text-sm font-bold text-muted">{t('orders.form.work')}</legend>
        <div className="flex flex-wrap gap-2">
          {WORK_STATUSES.map((w) => (
            <Chip key={w} tone={workTone[w]} selected={form.workStatus === w} onClick={() => update({ workStatus: w })}>
              {t(`orders.work.${w}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
        className="flex min-h-11 items-center justify-between rounded-2xl px-1 font-extrabold"
      >
        {t('orders.form.details')}
        <ChevronDown size={20} className={cn('text-muted transition-transform', showDetails && 'rotate-180')} />
      </button>

      {showDetails && (
        <div className="-mt-2 flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('orders.form.phone')} error={err('phone')}>
              {(id, d, inv) => (
                <TextInput
                  id={id}
                  aria-describedby={d}
                  invalid={inv}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder={t('orders.form.phonePh')}
                />
              )}
            </Field>
            <Field label={t('orders.form.extraPages')} error={err('extraPages')}>
              {(id, d, inv) => (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 shrink-0 rounded-2xl"
                    aria-label={t('orders.form.fewer')}
                    onClick={() => update({ extraPages: String(Math.max(0, (Number(form.extraPages) || 0) - 1)) })}
                  >
                    <Minus size={18} />
                  </Button>
                  <TextInput
                    id={id}
                    aria-describedby={d}
                    invalid={inv}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.extraPages}
                    onChange={(e) => update({ extraPages: e.target.value })}
                    className="tabular text-center"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 shrink-0 rounded-2xl"
                    aria-label={t('orders.form.more')}
                    onClick={() => update({ extraPages: String((Number(form.extraPages) || 0) + 1) })}
                  >
                    <Plus size={18} />
                  </Button>
                </div>
              )}
            </Field>
          </div>
          <Field label={t('orders.form.gift')} error={err('gift')}>
            {(id, d, inv) => <TextInput id={id} aria-describedby={d} invalid={inv} value={form.gift} onChange={(e) => update({ gift: e.target.value })} />}
          </Field>
          <fieldset>
            <legend className="px-1 pb-1.5 text-sm font-bold text-muted">{t('orders.form.source')}</legend>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <Chip key={s} selected={form.source === s} onClick={() => update({ source: form.source === s ? '' : s })}>
                  {t(`orders.source.${s}`)}
                </Chip>
              ))}
            </div>
          </fieldset>
          <Field label={t('orders.form.notes')} error={err('notes')}>
            {(id, d, inv) => (
              <TextArea id={id} aria-describedby={d} invalid={inv} value={form.notes} onChange={(e) => update({ notes: e.target.value })} placeholder={t('orders.form.notesPh')} rows={3} />
            )}
          </Field>
        </div>
      )}
    </form>
  )
}
