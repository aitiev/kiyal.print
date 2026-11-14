import { CheckCircle2, Download, Share, SquarePlus, Target } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/Page'
import { Button } from '@/components/Button'
import { Chip } from '@/components/Chip'
import { Field, TextInput } from '@/components/Field'
import { useGoals } from '@/db/hooks'
import { GoalSheet } from '@/features/dashboard/GoalCards'
import { isIOS, isStandalone, promptInstall, useCanPromptInstall } from '@/lib/install'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { usePrefs } from '@/store/prefs'

const PRESETS = [
  { code: 'KGS', symbol: 'сом' },
  { code: 'RUB', symbol: '₽' },
  { code: 'KZT', symbol: '₸' },
  { code: 'UZS', symbol: 'сўм' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
] as const

function isCurrencyCode(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false
  try {
    new Intl.NumberFormat('en', { style: 'currency', currency: code })
    return true
  } catch {
    return false
  }
}

export function CurrencyCard() {
  const { t } = useT()
  const money = useMoney()
  const currency = usePrefs((s) => s.currency)
  const symbol = usePrefs((s) => s.currencySymbol)
  const set = usePrefs((s) => s.set)
  const [code, setCode] = useState(currency)
  const codeOk = isCurrencyCode(code)

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-extrabold">{t('settings.currency')}</h2>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Chip
            key={p.code}
            selected={currency === p.code && symbol === p.symbol}
            onClick={() => {
              setCode(p.code)
              set({ currency: p.code, currencySymbol: p.symbol })
            }}
          >
            {`${p.code} · ${p.symbol}`}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('settings.currencyCode')} error={codeOk ? undefined : t('settings.currencyCodeError')}>
          {(id, d, inv) => (
            <TextInput
              id={id}
              aria-describedby={d}
              invalid={inv}
              value={code}
              maxLength={3}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
                setCode(v)
                if (isCurrencyCode(v)) set({ currency: v })
              }}
            />
          )}
        </Field>
        <Field label={t('settings.currencySymbol')} hint={t('settings.currencySymbolHint')}>
          {(id, d) => <TextInput id={id} aria-describedby={d} value={symbol} maxLength={6} onChange={(e) => set({ currencySymbol: e.target.value.trim() })} />}
        </Field>
      </div>
      <p className="text-sm font-semibold text-muted">
        {t('settings.currencyPreview')} <span className="tabular font-extrabold text-ink">{money(125050)}</span>
      </p>
    </Card>
  )
}

export function GoalSettingsCard() {
  const { t } = useT()
  const money = useMoney()
  const goals = useGoals()
  const [open, setOpen] = useState(false)
  const target = goals?.find((g) => g.type === 'monthly_income')?.targetAmount
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="font-extrabold">{t('dashboard.goal.title')}</h2>
        <p className="pt-1 text-sm font-semibold text-muted">
          {target !== undefined ? t('settings.goalCurrent', { amount: money(target) }) : t('dashboard.goal.none')}
        </p>
      </div>
      <Button variant="secondary" icon={<Target size={18} />} onClick={() => setOpen(true)} disabled={goals === undefined}>
        {target !== undefined ? t('dashboard.goal.editA11y') : t('dashboard.goal.set')}
      </Button>
      <GoalSheet open={open} onClose={() => setOpen(false)} target={target} />
    </Card>
  )
}

export function InstallCard() {
  const { t } = useT()
  const canPrompt = useCanPromptInstall()
  const [standalone] = useState(isStandalone)
  const [ios] = useState(isIOS)

  if (standalone) {
    return (
      <Card className="flex items-center gap-3">
        <CheckCircle2 className="shrink-0 text-mint" size={24} />
        <p className="font-bold">{t('install.done')}</p>
      </Card>
    )
  }
  return (
    <Card className="flex flex-col gap-3" data-testid="install-card">
      <div>
        <h2 className="font-extrabold">{t('install.title')}</h2>
        <p className="pt-1 text-sm font-semibold text-muted">{t('install.body')}</p>
      </div>
      {canPrompt && (
        <Button icon={<Download size={18} />} onClick={() => void promptInstall()}>
          {t('install.button')}
        </Button>
      )}
      {(ios || !canPrompt) && (
        <ol className="flex flex-col gap-2 text-sm font-semibold">
          {!ios && <li className="font-extrabold">{t('install.iosHeading')}</li>}
          <li className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lavender-soft text-lavender">
              <Share size={16} />
            </span>
            {t('install.step1')}
          </li>
          <li className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lavender-soft text-lavender">
              <SquarePlus size={16} />
            </span>
            {t('install.step2')}
          </li>
          <li className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lavender-soft font-black text-lavender">3</span>
            {t('install.step3')}
          </li>
          {!ios && <li className="pt-1 text-muted">{t('install.desktop')}</li>}
        </ol>
      )}
    </Card>
  )
}

export function AboutCard() {
  const { t } = useT()
  return (
    <Card className="flex flex-col gap-1">
      <h2 className="font-extrabold">
        {t('app.name')} <span className="text-sm font-bold text-muted">v{__APP_VERSION__}</span>
      </h2>
      <p className="text-sm font-semibold text-muted">{t('settings.about')}</p>
    </Card>
  )
}
