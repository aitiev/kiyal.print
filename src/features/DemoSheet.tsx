import { useState } from 'react'
import { Sheet } from '@/components/Sheet'
import { Button } from '@/components/Button'
import { Field, SelectInput, TextInput } from '@/components/Field'
import { Chip } from '@/components/Chip'
import { useT } from '@/hooks/useT'
import { toast, useUI } from '@/store/ui'

// Phase 1 design-system preview. Removed when the real order form lands (Phase 3).
export function DemoSheet() {
  const { t } = useT()
  const sheet = useUI((s) => s.sheet)
  const close = useUI((s) => s.closeSheet)
  const [pay, setPay] = useState<'paid' | 'half' | 'unpaid'>('unpaid')
  return (
    <Sheet
      open={sheet?.kind === 'demo'}
      onClose={close}
      title={t('fab.newOrder')}
      footer={
        <Button
          block
          onClick={() => {
            close()
            toast({ message: t('common.deleted'), actionLabel: t('common.undo'), onAction: () => {} })
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <Field label="Имя ребёнка" error="Обязательное поле">
          {(id, d, inv) => <TextInput id={id} aria-describedby={d} invalid={inv} placeholder="Айлин" />}
        </Field>
        <Field label="Цена" hint="сом">
          {(id, d) => <TextInput id={id} aria-describedby={d} inputMode="decimal" placeholder="800" />}
        </Field>
        <Field label="Телефон">{(id) => <TextInput id={id} type="tel" inputMode="tel" placeholder="+996" />}</Field>
        <Field label="Товар">
          {(id) => (
            <SelectInput id={id}>
              <option>Раскраска</option>
              <option>Книжка на липучках</option>
            </SelectInput>
          )}
        </Field>
        <div className="flex flex-wrap gap-2">
          <Chip tone="mint" selected={pay === 'paid'} onClick={() => setPay('paid')}>Оплачено</Chip>
          <Chip tone="sun" selected={pay === 'half'} onClick={() => setPay('half')}>50%</Chip>
          <Chip tone="danger" selected={pay === 'unpaid'} onClick={() => setPay('unpaid')}>Не оплачено</Chip>
        </div>
      </div>
    </Sheet>
  )
}
