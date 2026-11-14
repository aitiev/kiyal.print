import { Pencil, Scale, Target } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/Page'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { Field, TextInput } from '@/components/Field'
import { goalsRepo } from '@/db/repositories/goals'
import type { Minor } from '@/db/types'
import type { MsgKey } from '@/lib/i18n'
import { parseMoney, roundToMajor, toInputString } from '@/lib/money'
import { breakEven, goalProgress, type Summary } from '@/lib/stats'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { toast } from '@/store/ui'

function CardHeader({ icon, title, caption, action }: { icon: React.ReactNode; title: string; caption?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lavender-soft text-lavender">{icon}</span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-extrabold">{title}</h2>
        {caption && <p className="text-xs font-semibold text-muted">{caption}</p>}
      </div>
      {action}
    </div>
  )
}

/** All-time break-even: received vs expenses + ads. */
export function BreakEvenCard({ allTime }: { allTime: Summary }) {
  const { t, tp } = useT()
  const money = useMoney()
  const be = breakEven(allTime)
  return (
    <Card className="flex flex-col gap-3" data-testid="break-even">
      <CardHeader icon={<Scale size={18} />} title={t('dashboard.breakEven.title')} caption={t('dashboard.breakEven.caption')} />
      <ProgressBar value={be.progress} tone={be.reached ? 'mint' : 'lavender'} label={t('dashboard.breakEven.title')} />
      <div className="tabular text-sm font-bold text-muted">
        {t('dashboard.breakEven.ofCosts', { received: money(allTime.received), costs: money(allTime.costs) })}
      </div>
      <p className="font-bold">
        {be.reached
          ? t('dashboard.breakEven.reached')
          : be.ordersNeeded !== null && allTime.avgOrderValue !== null
            ? tp('dashboard.breakEven.more', be.ordersNeeded, { avg: money(roundToMajor(allTime.avgOrderValue)) })
            : t('dashboard.breakEven.noOrders', { amount: money(be.remaining) })}
      </p>
    </Card>
  )
}

/** Monthly income goal: progress of this month's received money. */
export function IncomeGoalCard({ target, current }: { target: Minor | undefined; current: Minor }) {
  const { t } = useT()
  const money = useMoney()
  const [open, setOpen] = useState(false)
  const gp = target !== undefined ? goalProgress(current, target) : null
  return (
    <Card className="flex flex-col gap-3" data-testid="income-goal">
      <CardHeader
        icon={<Target size={18} />}
        title={t('dashboard.goal.title')}
        caption={t('dashboard.period.this_month')}
        action={
          gp && (
            <Button variant="ghost" size="sm" icon={<Pencil size={16} />} aria-label={t('dashboard.goal.editA11y')} onClick={() => setOpen(true)}>
              {t('dashboard.goal.edit')}
            </Button>
          )
        }
      />
      {gp ? (
        <>
          <ProgressBar value={gp.progress} tone="mint" label={t('dashboard.goal.title')} />
          <div className="tabular text-sm font-bold text-muted">
            {t('dashboard.goal.progress', { current: money(gp.current), target: money(gp.target) })}
          </div>
          <p className="font-bold">{gp.reached ? t('dashboard.goal.reached') : t('dashboard.goal.remaining', { amount: money(gp.remaining) })}</p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-muted">{t('dashboard.goal.none')}</p>
          <Button variant="secondary" icon={<Target size={18} />} onClick={() => setOpen(true)}>
            {t('dashboard.goal.set')}
          </Button>
        </>
      )}
      <GoalSheet open={open} onClose={() => setOpen(false)} target={gp ? gp.target : undefined} />
    </Card>
  )
}

/** Set / edit / remove the monthly income goal. Used by the dashboard and Settings. */
export function GoalSheet({ open, onClose, target }: { open: boolean; onClose: () => void; target: Minor | undefined }) {
  const { t } = useT()
  return (
    <Sheet open={open} onClose={onClose} title={t('dashboard.goal.sheetTitle')} size="sm">
      {open && <GoalForm target={target} onDone={onClose} />}
    </Sheet>
  )
}

function GoalForm({ target, onDone }: { target: Minor | undefined; onDone: () => void }) {
  const { t, lang } = useT()
  const money = useMoney()
  const [value, setValue] = useState(() => toInputString(target, lang))
  const [error, setError] = useState<MsgKey>()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return setError('validation.required')
    const amount = parseMoney(value)
    if (amount === null) return setError('validation.invalidNumber')
    if (amount <= 0) return setError('validation.positive')
    if (amount > 1e13) return setError('validation.tooLarge')
    await goalsRepo.set('monthly_income', amount)
    toast({ message: t('dashboard.goal.saved') })
    onDone()
  }

  const remove = async () => {
    await goalsRepo.remove('monthly_income')
    toast({ message: t('dashboard.goal.removed') })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 pb-2" noValidate>
      <Field label={`${t('dashboard.goal.amount')}, ${money.unit}`} error={error && t(error)} hint={t('dashboard.goal.hint')}>
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
      <Button type="submit" block>
        {t('common.save')}
      </Button>
      {target !== undefined && (
        <Button variant="danger" block onClick={remove}>
          {t('dashboard.goal.remove')}
        </Button>
      )}
    </form>
  )
}
