import { describe, expect, it } from 'vitest'
import { backoffMs, hashPin, isPinRecord, isValidPin, verifyPin } from './pin'

describe('pin', () => {
  it('hashes with a random salt and verifies', async () => {
    const a = await hashPin('1234', 1000)
    const b = await hashPin('1234', 1000)
    expect(isPinRecord(a)).toBe(true)
    expect(a.hash).not.toBe(b.hash) // different salts
    expect(await verifyPin('1234', a)).toBe(true)
    expect(await verifyPin('1235', a)).toBe(false)
    expect(a.hash).not.toContain('1234')
  })

  it('validates format', () => {
    expect(isValidPin('0000')).toBe(true)
    expect(isValidPin('123')).toBe(false)
    expect(isValidPin('12a4')).toBe(false)
    expect(isPinRecord({ hash: 'x' })).toBe(false)
  })

  it('backs off after 5 failures, capped', () => {
    expect(backoffMs(4)).toBe(0)
    expect(backoffMs(5)).toBe(30_000)
    expect(backoffMs(6)).toBe(60_000)
    expect(backoffMs(20)).toBe(300_000)
  })
})
