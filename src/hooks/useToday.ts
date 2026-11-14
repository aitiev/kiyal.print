import { useSyncExternalStore } from 'react'

/** Start of the current local day (ms). */
const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

let today = startOfToday()
const listeners = new Set<() => void>()
function refresh() {
  const next = startOfToday()
  if (next !== today) {
    today = next
    listeners.forEach((l) => l())
  }
}
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(cb: () => void) {
  listeners.add(cb)
  if (listeners.size === 1) {
    timer = setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
  }
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0) {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }
}

/**
 * A render-safe "now" for calendar logic (due badges, periods): the start of today.
 * Re-renders subscribers when the day changes, including after the PWA resumes from the background.
 */
export function useToday(): number {
  return useSyncExternalStore(subscribe, () => today, () => today)
}
