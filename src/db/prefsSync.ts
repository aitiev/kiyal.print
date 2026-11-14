/**
 * Keeps the Zustand `usePrefs` store in sync with the Dexie `settings` table:
 * localStorage = fast boot cache, Dexie = source of truth (included in backups).
 */
import { DEFAULT_PREFS, usePrefs, type Prefs } from '@/store/prefs'
import { settingsRepo } from './repositories/settings'

const pick = (s: Prefs): Prefs => ({ lang: s.lang, theme: s.theme, currency: s.currency, currencySymbol: s.currencySymbol })

/** Load prefs from Dexie into the store (call on start and after a restore). */
export async function loadPrefsFromDb(): Promise<void> {
  const stored = await settingsRepo.get<Partial<Prefs>>('prefs')
  if (stored && typeof stored === 'object') usePrefs.getState().set({ ...DEFAULT_PREFS, ...stored })
  else await settingsRepo.set('prefs', pick(usePrefs.getState()))
}

let started = false
export async function initPrefsSync(): Promise<void> {
  if (started) return
  started = true
  try {
    await loadPrefsFromDb()
  } catch (e) {
    console.warn('prefs: could not read settings', e)
  }
  let last = JSON.stringify(pick(usePrefs.getState()))
  usePrefs.subscribe((s) => {
    const next = JSON.stringify(pick(s))
    if (next === last) return
    last = next
    settingsRepo.set('prefs', pick(s)).catch((e) => console.warn('prefs: save failed', e))
  })
}
