import { useSyncExternalStore } from 'react'

export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => matchMedia(query).matches,
    () => false,
  )
}

/** iPad portrait and wider: side rail + centred dialogs. */
export const useIsWide = () => useMedia('(min-width: 768px)')
