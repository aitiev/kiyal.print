import ru, { type Messages } from './ru'
import en from './en'

export type Lang = 'ru' | 'en'
export const LANGS: Lang[] = ['ru', 'en']
export const dictionaries: Record<Lang, Messages> = { ru, en }

/** Dotted paths to leaf strings, e.g. "orders.title". */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]
export type MsgKey = Leaves<Messages>

/** Keys that have plural variants, e.g. "orders.count" for "orders.count_one". */
export type PluralKey = MsgKey extends infer K
  ? K extends `${infer Base}_one`
    ? Base
    : never
  : never

export type Params = Record<string, string | number>

function lookup(dict: Messages, key: string): string | undefined {
  let cur: unknown = dict
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in cur) cur = (cur as Record<string, unknown>)[part]
    else return undefined
  }
  return typeof cur === 'string' ? cur : undefined
}

function interpolate(s: string, params?: Params): string {
  if (!params) return s
  return s.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m))
}

export function translate(lang: Lang, key: MsgKey, params?: Params): string {
  const s = lookup(dictionaries[lang], key) ?? lookup(ru, key) ?? key
  return interpolate(s, params)
}

const pluralRules: Partial<Record<Lang, Intl.PluralRules>> = {}
export function translatePlural(lang: Lang, key: PluralKey, n: number, params?: Params): string {
  const rules = (pluralRules[lang] ??= new Intl.PluralRules(lang))
  const cat = rules.select(n)
  const s =
    lookup(dictionaries[lang], `${key}_${cat}`) ??
    lookup(dictionaries[lang], `${key}_other`) ??
    lookup(ru, `${key}_other`) ??
    key
  return interpolate(s, { n, ...params })
}

export const LOCALE: Record<Lang, string> = { ru: 'ru-RU', en: 'en-GB' }
