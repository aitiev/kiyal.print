import { describe, expect, it } from 'vitest'
import { addDaysISO, daysBetween, daysUntil, formatMonth, inRange, isValidISODate, monthKey, monthKeysBetween, parseISODate, periodRange, toISODate } from './dates'

const NOW = new Date(2026, 10, 14, 15, 30) // 14 Nov 2026 local

describe('dates', () => {
  it('round-trips ISO dates in local time', () => {
    expect(toISODate(NOW)).toBe('2026-11-14')
    expect(parseISODate('2026-11-14')?.getDate()).toBe(14)
    expect(parseISODate('2026-02-30')).toBeNull()
    expect(isValidISODate('2026-13-01')).toBe(false)
    expect(isValidISODate('2026-12-31')).toBe(true)
    expect(isValidISODate(20261231)).toBe(false)
  })
  it('adds days across month/year boundaries', () => {
    expect(addDaysISO('2026-12-31', 2)).toBe('2027-01-02')
    expect(addDaysISO(NOW, 2)).toBe('2026-11-16')
    expect(addDaysISO('2028-02-28', 1)).toBe('2028-02-29')
  })
  it('counts calendar days', () => {
    expect(daysUntil('2026-11-14', NOW)).toBe(0)
    expect(daysUntil('2026-11-16', NOW)).toBe(2)
    expect(daysUntil('2026-11-10', NOW)).toBe(-4)
  })
  it('computes period ranges', () => {
    expect(periodRange('this_month', NOW)).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(periodRange('last_month', NOW)).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(periodRange('last_month', new Date(2026, 0, 10))).toEqual({ from: '2025-12-01', to: '2025-12-31' })
    expect(periodRange('all_time', NOW)).toEqual({ from: null, to: null })
    expect(inRange('2026-11-30', periodRange('this_month', NOW))).toBe(true)
    expect(inRange('2026-12-01', periodRange('this_month', NOW))).toBe(false)
    expect(inRange('1999-01-01', periodRange('all_time', NOW))).toBe(true)
  })
  it('builds month and day keys', () => {
    expect(monthKey('2026-11-14')).toBe('2026-11')
    expect(monthKey(NOW.getTime())).toBe('2026-11')
    expect(monthKeysBetween('2026-10', '2027-01')).toEqual(['2026-10', '2026-11', '2026-12', '2027-01'])
    expect(daysBetween('2026-11-29', '2026-12-01')).toEqual(['2026-11-29', '2026-11-30', '2026-12-01'])
  })
  it('formats months', () => {
    expect(formatMonth('2026-11', 'en')).toBe('November 2026')
    expect(formatMonth('2026-11', 'ru')).toMatch(/^Ноябрь 2026/)
  })
})
