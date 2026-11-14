import { create } from 'zustand'
import { settingsRepo } from '@/db/repositories/settings'
import { backoffMs, hashPin, isPinRecord, verifyPin, type PinRecord } from '@/lib/pin'

export type LockStatus = 'checking' | 'locked' | 'unlocked'
export const LOCK_TIMEOUTS = [0, 1, 5, 15] as const
export type LockTimeout = (typeof LOCK_TIMEOUTS)[number]
const DEFAULT_TIMEOUT: LockTimeout = 1

const FAIL_KEY = 'kp.pinFail'
interface FailState {
  count: number
  /** epoch ms until which input is blocked */
  until: number
}
function loadFails(): FailState {
  try {
    const raw = localStorage.getItem(FAIL_KEY)
    if (raw) return { count: 0, until: 0, ...(JSON.parse(raw) as Partial<FailState>) }
  } catch {
    /* ignore */
  }
  return { count: 0, until: 0 }
}
function saveFails(f: FailState) {
  try {
    if (f.count === 0) localStorage.removeItem(FAIL_KEY)
    else localStorage.setItem(FAIL_KEY, JSON.stringify(f))
  } catch {
    /* ignore */
  }
}

interface LockState {
  status: LockStatus
  hasPin: boolean
  timeoutMin: LockTimeout
  fails: FailState
}

/** App lock (PIN). Settings live in Dexie; the failure counter in localStorage so a reload doesn't reset it. */
export const useLock = create<LockState>(() => ({
  status: 'checking',
  hasPin: false,
  timeoutMin: DEFAULT_TIMEOUT,
  fails: loadFails(),
}))

let record: PinRecord | null = null
let hiddenAt: number | null = null
let started = false

export async function initLock(): Promise<void> {
  if (started) return
  started = true
  try {
    const [pin, timeout] = await Promise.all([settingsRepo.get<unknown>('pinHash'), settingsRepo.get<number>('lockTimeoutMin')])
    record = isPinRecord(pin) ? pin : null
    const timeoutMin = (LOCK_TIMEOUTS as readonly number[]).includes(timeout ?? -1) ? (timeout as LockTimeout) : DEFAULT_TIMEOUT
    useLock.setState({ status: record ? 'locked' : 'unlocked', hasPin: !!record, timeoutMin })
  } catch (e) {
    console.warn('lock: could not read settings', e)
    useLock.setState({ status: 'unlocked' })
  }
  document.addEventListener('visibilitychange', () => {
    const { hasPin, status, timeoutMin } = useLock.getState()
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now()
      if (hasPin && timeoutMin === 0) lockNow()
    } else if (hiddenAt !== null && hasPin && status === 'unlocked' && Date.now() - hiddenAt >= timeoutMin * 60_000) {
      lockNow()
    }
  })
}

export function lockNow() {
  if (useLock.getState().hasPin) useLock.setState({ status: 'locked' })
}

export type UnlockResult = { ok: true } | { ok: false; waitUntil: number }

/** Check the PIN on the lock screen, with backoff after repeated failures. */
export async function unlock(pin: string, now = Date.now()): Promise<UnlockResult> {
  const { fails } = useLock.getState()
  if (fails.until > now) return { ok: false, waitUntil: fails.until }
  if (!record || (await verifyPin(pin, record))) {
    const reset = { count: 0, until: 0 }
    saveFails(reset)
    useLock.setState({ status: 'unlocked', fails: reset })
    return { ok: true }
  }
  const count = fails.count + 1
  const next = { count, until: now + backoffMs(count) }
  saveFails(next)
  useLock.setState({ fails: next })
  return { ok: false, waitUntil: next.until }
}

/** Verify without unlocking or counting (used by the settings flows). */
export const checkPin = async (pin: string) => !record || verifyPin(pin, record)

export async function setPin(pin: string): Promise<void> {
  const rec = await hashPin(pin)
  await settingsRepo.set('pinHash', rec)
  record = rec
  useLock.setState({ hasPin: true })
}

export async function disablePin(): Promise<void> {
  await settingsRepo.remove('pinHash')
  record = null
  saveFails({ count: 0, until: 0 })
  useLock.setState({ hasPin: false, status: 'unlocked', fails: { count: 0, until: 0 } })
}

export async function setLockTimeout(timeoutMin: LockTimeout): Promise<void> {
  await settingsRepo.set('lockTimeoutMin', timeoutMin)
  useLock.setState({ timeoutMin })
}
