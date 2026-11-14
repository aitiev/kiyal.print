import { useCallback } from 'react'
import { usePrefs } from '@/store/prefs'
import { formatMoney, type Minor } from '@/lib/money'

/** `const money = useMoney(); money(80000) → "800 сом"`. Also exposes the unit label for inputs. */
export function useMoney() {
  const lang = usePrefs((s) => s.lang)
  const currency = usePrefs((s) => s.currency)
  const symbol = usePrefs((s) => s.currencySymbol)
  const fmt = useCallback(
    (amount: Minor, opts?: { compact?: boolean }) => formatMoney(amount, { lang, currency, symbol }, opts),
    [lang, currency, symbol],
  )
  return Object.assign(fmt, { unit: symbol || currency })
}
