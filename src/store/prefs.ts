import { create } from 'zustand'
import type { Lang } from '@/lib/i18n'

export type ThemePref = 'system' | 'light' | 'dark'

export interface Prefs {
  lang: Lang
  theme: ThemePref
  /** ISO 4217 code used for Intl formatting (e.g. KGS). */
  currency: string
  /** Display symbol override; empty = use Intl's symbol. */
  currencySymbol: string
}

const KEY = 'kp.prefs'
export const DEFAULT_PREFS: Prefs = { lang: 'ru', theme: 'system', currency: 'KGS', currencySymbol: 'сом' }

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

interface PrefsState extends Prefs {
  set: (patch: Partial<Prefs>) => void
}

/**
 * Display preferences. localStorage is a boot cache so the first paint has no flash.
 * Phase 2+ mirrors these into the Dexie `settings` table so they get backed up.
 */
export const usePrefs = create<PrefsState>((set, get) => ({
  ...load(),
  set: (patch) => {
    set(patch)
    const { lang, theme, currency, currencySymbol } = get()
    try {
      localStorage.setItem(KEY, JSON.stringify({ lang, theme, currency, currencySymbol }))
    } catch {
      /* private mode: ignore */
    }
  },
}))
