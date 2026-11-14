import { useEffect } from 'react'
import { usePrefs } from '@/store/prefs'
import { useMedia } from './useMedia'

/** Applies the theme and language to <html> and the theme-color meta. */
export function useApplyPrefs() {
  const theme = usePrefs((s) => s.theme)
  const lang = usePrefs((s) => s.lang)
  const systemDark = useMedia('(prefers-color-scheme: dark)')
  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved
    root.lang = lang
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  }, [resolved, lang])
}
