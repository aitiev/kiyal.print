import { FormSheet } from '@/components/FormSheet'
import { Chip } from '@/components/Chip'
import { Field, TextInput } from '@/components/Field'
import { expensesRepo, EXPENSE_CATEGORIES, type Expense } from '@/db'
import { useExpense } from '@/db/hooks'
import { todayISO } from '@/lib/dates'
import { newExpenseDraft } from '@/lib/defaults'
import { expenseToForm } from '@/lib/forms'
import { divideMinor, parseDecimal, parseMoney } from '@/lib/money'
import { parseExpenseForm } from '@/lib/validation'
import { useFormState } from '@/hooks/useFormState'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { toast, useUI } from '@/store/ui'
import { categoryTone, UNIT_KEYS } from './meta'
import { useExpenseActions } from './useExpenseActions'

const FORM_ID = 'expense-form'

export function ExpenseFormSheet() {
  const { t } = useT()
  const sheet = useUI((s) => s.sheet)
  const close = useUI((s) => s.closeSheet)
  const open = sheet?.kind === 'expense'
  const id = open ? sheet.id : undefined
  const row = useExpense(id)
  const { removeExpense } = useExpenseActions()

  return (
    <FormSheet
      open={open}
      onClose={close}
      title={t(id ? 'expenses.form.editTitle' : 'expenses.form.newTitle')}
      formId={FORM_ID}
      id={id}
      row={row}
      notFoundText={t('expenses.form.notFound')}
      deleteLabel={t('expenses.form.deleteButton')}
      onDelete={removeExpense}
    >
      {(r) => <ExpenseForm key={id ?? 'new'} expense={r} onDone={close} />}
    </FormSheet>
  )
}

function ExpenseForm({ expense, onDone }: { expense?: Expense; onDone: () => void }) {
  const { t, lang } = useT()
  const money = useMoney()
  const today = todayISO(useToday())
  const { form, update, err, handleSubmit, formRef } = useFormState(
    () => expenseToForm(expense ?? newExpenseDraft(), lang),
    (f) => parseExpenseForm(f, Date.now()),
  )

  const price = parseMoney(form.price)
  const qty = form.qty.trim() ? parseDecimal(form.qty) : null
  const unitCost = price !== null && qty ? divideMinor(price, qty) : null
  const unitLabel = form.unit.trim() || t('expenses.units.pcs')

  const submit = handleSubmit(async (value) => {
    if (expense) await expensesRepo.update(expense.id, value)
    else await expensesRepo.create(value)
    toast({ message: t(expense ? 'expenses.toast.saved' : 'expenses.toast.created') })
    onDone()
  })

  return (
    <form id={FORM_ID} ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5 pb-4 pt-1">
      <Field label={t('expenses.form.title')} error={err('title')}>
        {(id, d, inv) => (
          <TextInput
            id={id}
            aria-describedby={d}
            invalid={inv}
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder={t('expenses.form.titlePh')}
            autoComplete="off"
            enterKeyHint="next"
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
        <Field label={`${t('expenses.form.price')}, ${money.unit}`} error={err('price')}>
          {(id, d, inv) => (
            <TextInput
              id={id}
              aria-describedby={d}
              invalid={inv}
              inputMode="decimal"
              value={form.price}
              onChange={(e) => update({ price: e.target.value })}
              placeholder="650"
              className="tabular"
            />
          )}
        </Field>
        <Field label={t('expenses.form.date')} error={err('date')}>
          {(id, d, inv) => (
            <TextInput id={id} aria-describedby={d} invalid={inv} type="date" max={today} value={form.date} onChange={(e) => update({ date: e.target.value })} />
          )}
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('expenses.form.qty')} error={err('qty')}>
          {(id, d, inv) => (
            <TextInput
              id={id}
              aria-describedby={d}
              invalid={inv}
              inputMode="decimal"
              value={form.qty}
              onChange={(e) => update({ qty: e.target.value })}
              placeholder={t('expenses.form.qtyPh')}
              className="tabular"
            />
          )}
        </Field>
        <Field label={t('expenses.form.unit')} error={err('unit')}>
          {(id, d, inv) => (
            <>
              <TextInput
                id={id}
                aria-describedby={d}
                invalid={inv}
                list="expense-units"
                value={form.unit}
                onChange={(e) => update({ unit: e.target.value })}
                placeholder={t('expenses.form.unitPh')}
                autoComplete="off"
              />
              <datalist id="expense-units">
                {UNIT_KEYS.map((u) => (
                  <option key={u} value={t(`expenses.units.${u}`)} />
                ))}
              </datalist>
            </>
          )}
        </Field>
      </div>
      {unitCost !== null && (
        <p className="-mt-2 rounded-2xl bg-mint-soft px-4 py-3 text-sm font-bold text-mint" role="status">
          {t('expenses.form.unitCostPreview', { price: money(unitCost), unit: unitLabel })}
        </p>
      )}

      <fieldset>
        <legend className="px-1 pb-1.5 text-sm font-bold text-muted">{t('expenses.form.category')}</legend>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((c) => (
            <Chip key={c} tone={categoryTone[c]} selected={form.category === c} onClick={() => update({ category: c })}>
              {t(`expenses.category.${c}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
    </form>
  )
}
