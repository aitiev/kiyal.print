/**
 * Money helpers. All amounts are integers in minor units (1 som = 100 tyiyn).
 * Never add floats: convert user input with parseMoney/toMinor once, then use integer maths.
 */
import { LOCALE, type Lang } from './i18n'

export type Minor = number

export const MINOR_PER_MAJOR = 100

export function toMinor(major: number): Minor {
  return Math.round(major * MINOR_PER_MAJOR)
}

export function fromMinor(minor: Minor): number {
  return minor / MINOR_PER_MAJOR
}

/** Integer-safe sum. */
export function sumMinor(values: Iterable<Minor>): Minor {
  let total = 0
  for (const v of values) total += Math.round(v)
  return total
}

/** pct% of an amount, rounded to a whole minor unit. */
export function percentOf(amount: Minor, pct: number): Minor {
  return Math.round((amount * pct) / 100)
}

/** amount / n rounded to a minor unit; null when n is not positive. */
export function divideMinor(amount: Minor, n: number): Minor | null {
  if (!(n > 0) || !Number.isFinite(n)) return null
  return Math.round(amount / n)
}

/**
 * Parse user input like "1 200,50", "1200.5", "800" into minor units.
 * Returns null for empty or invalid input. Negative numbers are rejected.
 */
export function parseMoney(input: string): Minor | null {
  const s = input.replace(/[\s\u00a0\u202f']/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(s) && !/^\.\d{1,2}$/.test(s)) return null
  const [int = '0', frac = ''] = s.split('.')
  return Number(int || '0') * MINOR_PER_MAJOR + Number((frac + '00').slice(0, 2))
}

/** Parse a non-negative decimal number (e.g. quantity "2,5"). */
export function parseDecimal(input: string): number | null {
  const s = input.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(s)) return null
  return Number(s)
}

export interface MoneyFormat {
  lang: Lang
  /** ISO 4217 code, e.g. KGS */
  currency: string
  /** Display symbol override, e.g. "сом". Empty → Intl's currency display. */
  symbol?: string
}

const nfCache = new Map<string, Intl.NumberFormat>()
function nf(locale: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(opts)
  let f = nfCache.get(key)
  if (!f) nfCache.set(key, (f = new Intl.NumberFormat(locale, opts)))
  return f
}

/** "1 200 сом", "1 200,50 сом", "−300 сом". Fractions shown only when non-zero. */
export function formatMoney(amount: Minor, fmt: MoneyFormat, opts: { compact?: boolean } = {}): string {
  const locale = LOCALE[fmt.lang]
  const major = fromMinor(amount)
  const whole = amount % MINOR_PER_MAJOR === 0
  const base: Intl.NumberFormatOptions = opts.compact
    ? { notation: 'compact', maximumFractionDigits: 1 }
    : { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }
  if (fmt.symbol) return `${nf(locale, base).format(major)}\u00a0${fmt.symbol}`
  try {
    return nf(locale, { ...base, style: 'currency', currency: fmt.currency }).format(major)
  } catch {
    return `${nf(locale, base).format(major)}\u00a0${fmt.currency}`
  }
}

/** Plain value for pre-filling an input: "1200" or "1200,5" (ru) / "1200.5" (en). */
export function toInputString(amount: Minor | undefined | null, lang: Lang): string {
  if (amount == null) return ''
  const major = fromMinor(amount)
  const s = String(Number(major.toFixed(2)))
  return lang === 'ru' ? s.replace('.', ',') : s
}
