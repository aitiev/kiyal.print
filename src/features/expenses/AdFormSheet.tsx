import { FormSheet } from '@/components/FormSheet'
import { Field, TextArea, TextInput } from '@/components/Field'
import { adsRepo, type Ad } from '@/db'
import { useAd } from '@/db/hooks'
import { todayISO } from '@/lib/dates'
import { newAdDraft } from '@/lib/defaults'
import { adToForm } from '@/lib/forms'
import { parseAdForm } from '@/lib/validation'
import { useFormState } from '@/hooks/useFormState'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { toast, useUI } from '@/store/ui'
import { CHANNEL_KEYS } from './meta'
import { useExpenseActions } from './useExpenseActions'

const FORM_ID = 'ad-form'

export function AdFormSheet() {
  const { t } = useT()
  const sheet = useUI((s) => s.sheet)
  const close = useUI((s) => s.closeSheet)
  const open = sheet?.kind === 'ad'
  const id = open ? sheet.id : undefined
  const row = useAd(id)
  const { removeAd } = useExpenseActions()

  return (
    <FormSheet
      open={open}
      onClose={close}
      title={t(id ? 'expenses.adForm.editTitle' : 'expenses.adForm.newTitle')}
      formId={FORM_ID}
      id={id}
      row={row}
      notFoundText={t('expenses.adForm.notFound')}
      deleteLabel={t('expenses.adForm.deleteButton')}
      onDelete={removeAd}
    >
      {(r) => <AdForm key={id ?? 'new'} ad={r} onDone={close} />}
    </FormSheet>
  )
}

function AdForm({ ad, onDone }: { ad?: Ad; onDone: () => void }) {
  const { t, lang } = useT()
  const money = useMoney()
  const today = todayISO(useToday())
  const { form, update, err, handleSubmit, formRef } = useFormState(
    () => adToForm(ad ?? newAdDraft(), lang),
    (f) => parseAdForm(f, Date.now()),
  )

  const submit = handleSubmit(async (value) => {
    if (ad) await adsRepo.update(ad.id, value)
    else await adsRepo.create(value)
    toast({ message: t(ad ? 'expenses.toast.saved' : 'expenses.toast.adCreated') })
    onDone()
  })

  return (
    <form id={FORM_ID} ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5 pb-4 pt-1">
      <Field label={t('expenses.adForm.title')} error={err('title')}>
        {(id, d, inv) => (
          <TextInput
            id={id}
            aria-describedby={d}
            invalid={inv}
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder={t('expenses.adForm.titlePh')}
            autoComplete="off"
          />
        )}
      </Field>
      <Field label={t('expenses.adForm.channel')} error={err('channel')}>
        {(id, d, inv) => (
          <>
            <TextInput
              id={id}
              aria-describedby={d}
              invalid={inv}
              list="ad-channels"
              value={form.channel}
              onChange={(e) => update({ channel: e.target.value })}
              placeholder={t('expenses.adForm.channelPh')}
              autoComplete="off"
            />
            <datalist id="ad-channels">
              {CHANNEL_KEYS.map((c) => (
                <option key={c} value={t(`expenses.channels.${c}`)} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
        <Field label={`${t('expenses.adForm.cost')}, ${money.unit}`} error={err('cost')}>
          {(id, d, inv) => (
            <TextInput
              id={id}
              aria-describedby={d}
              invalid={inv}
              inputMode="decimal"
              value={form.cost}
              onChange={(e) => update({ cost: e.target.value })}
              placeholder="1500"
              className="tabular"
            />
          )}
        </Field>
        <Field label={t('expenses.adForm.date')} error={err('date')}>
          {(id, d, inv) => (
            <TextInput id={id} aria-describedby={d} invalid={inv} type="date" max={today} value={form.date} onChange={(e) => update({ date: e.target.value })} />
          )}
        </Field>
      </div>
      <Field label={t('expenses.adForm.notes')} error={err('notes')}>
        {(id, d, inv) => (
          <TextArea id={id} aria-describedby={d} invalid={inv} rows={3} value={form.notes} onChange={(e) => update({ notes: e.target.value })} placeholder={t('expenses.adForm.notesPh')} />
        )}
      </Field>
    </form>
  )
}
