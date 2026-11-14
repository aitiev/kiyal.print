/**
 * PIN hashing (PBKDF2-SHA-256 via Web Crypto) and brute-force backoff.
 * The PIN only keeps casual eyes out on a shared device: data in IndexedDB is not encrypted.
 */
export const PIN_LENGTH = 4
const ITERATIONS = 100_000

export interface PinRecord {
  v: 1
  salt: string
  hash: string
  iterations: number
}

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256)
  return toB64(new Uint8Array(bits))
}

export const isValidPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)

export async function hashPin(pin: string, iterations = ITERATIONS): Promise<PinRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { v: 1, salt: toB64(salt), hash: await derive(pin, salt, iterations), iterations }
}

export async function verifyPin(pin: string, rec: PinRecord): Promise<boolean> {
  const hash = await derive(pin, fromB64(rec.salt), rec.iterations)
  // Length is fixed; a plain loop avoids early exit.
  let diff = hash.length ^ rec.hash.length
  for (let i = 0; i < Math.min(hash.length, rec.hash.length); i++) diff |= hash.charCodeAt(i) ^ rec.hash.charCodeAt(i)
  return diff === 0
}

export function isPinRecord(x: unknown): x is PinRecord {
  const r = x as PinRecord
  return !!r && typeof r === 'object' && r.v === 1 && typeof r.salt === 'string' && typeof r.hash === 'string' && Number.isInteger(r.iterations)
}

/** Free attempts before a wait kicks in. */
export const FREE_ATTEMPTS = 5

/** Wait (ms) after `failures` wrong attempts: 0 for the first 5, then 30 s doubling, capped at 5 min. */
export function backoffMs(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0
  return Math.min(30_000 * 2 ** (failures - FREE_ATTEMPTS), 5 * 60_000)
}
