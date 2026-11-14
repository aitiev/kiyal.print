import { useCallback } from 'react'
import { usePrefs } from '@/store/prefs'
import { translate, translatePlural, type MsgKey, type Params, type PluralKey } from '@/lib/i18n'

/** `const { t, tp, lang } = useT()`: re-renders when the language changes. */
export function useT() {
  const lang = usePrefs((s) => s.lang)
  const t = useCallback((key: MsgKey, params?: Params) => translate(lang, key, params), [lang])
  const tp = useCallback(
    (key: PluralKey, n: number, params?: Params) => translatePlural(lang, key, n, params),
    [lang],
  )
  return { t, tp, lang }
}
