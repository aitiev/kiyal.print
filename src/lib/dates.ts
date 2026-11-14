/**
 * Date helpers. Calendar dates are local "YYYY-MM-DD" strings (ISODate),
 * timestamps are epoch ms. No timezone conversions on calendar dates.
 */
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isValid,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { LOCALE, type Lang } from './i18n'

export type ISODate = string
export type Period = 'this_month' | 'last_month' | 'all_time'
export const PERIODS: Period[] = ['this_month', 'last_month', 'all_time']

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function toISODate(d: Date | number): ISODate {
  return format(d, 'yyyy-MM-dd')
}

/** Local midnight Date for an ISODate, or null if invalid. */
export function parseISODate(s: string): Date | null {
  const m = ISO_RE.exec(s)
  if (!m) return null
  const [, y, mo, d] = m
  const date = new Date(Number(y), Number(mo) - 1, Number(d))
  if (!isValid(date) || date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null
  return date
}

export function isValidISODate(s: unknown): s is ISODate {
  return typeof s === 'string' && parseISODate(s) !== null
}

export function todayISO(now: Date | number = Date.now()): ISODate {
  return toISODate(now)
}

export function addDaysISO(base: ISODate | Date | number, days: number): ISODate {
  const d = typeof base === 'string' ? parseISODate(base) : new Date(base)
  if (!d) throw new Error(`Invalid date: ${String(base)}`)
  return toISODate(addDays(d, days))
}

/** Calendar days from today until `iso` (negative = past). */
export function daysUntil(iso: ISODate, now: Date | number = Date.now()): number {
  const d = parseISODate(iso)
  if (!d) return NaN
  return differenceInCalendarDays(d, now)
}

/** "YYYY-MM" for an ISODate or epoch ms. */
export function monthKey(v: ISODate | number): string {
  return typeof v === 'string' ? v.slice(0, 7) : format(v, 'yyyy-MM')
}

/** Inclusive date range. `null` bounds = unbounded (all time). */
export interface DateRange {
  from: ISODate | null
  to: ISODate | null
}

export function periodRange(period: Period, now: Date | number = Date.now()): DateRange {
  const d = new Date(now)
  switch (period) {
    case 'this_month':
      return { from: toISODate(startOfMonth(d)), to: toISODate(endOfMonth(d)) }
    case 'last_month': {
      const p = subMonths(d, 1)
      return { from: toISODate(startOfMonth(p)), to: toISODate(endOfMonth(p)) }
    }
    case 'all_time':
      return { from: null, to: null }
  }
}

export function inRange(iso: ISODate, r: DateRange): boolean {
  return (r.from === null || iso >= r.from) && (r.to === null || iso <= r.to)
}

/** Range check for an epoch-ms timestamp (compared by local calendar date). */
export function msInRange(ms: number, r: DateRange): boolean {
  return inRange(toISODate(ms), r)
}

/** All month keys from `fromKey` to `toKey` inclusive ("YYYY-MM"). */
export function monthKeysBetween(fromKey: string, toKey: string): string[] {
  const start = parseISODate(`${fromKey}-01`)
  const end = parseISODate(`${toKey}-01`)
  if (!start || !end || start > end) return []
  const out: string[] = []
  for (let m = start; m <= end; m = addMonths(m, 1)) out.push(format(m, 'yyyy-MM'))
  return out
}

/** All ISODates from `from` to `to` inclusive. */
export function daysBetween(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  const end = parseISODate(to)
  let d = parseISODate(from)
  if (!d || !end) return out
  for (; d <= end; d = addDays(d, 1)) out.push(toISODate(d))
  return out
}

/** Localised short date: "14 нояб." / "14 Nov"; adds the year if it differs from now. */
export function formatDate(iso: ISODate, lang: Lang, now: Date | number = Date.now()): string {
  const d = parseISODate(iso)
  if (!d) return iso
  const sameYear = d.getFullYear() === new Date(now).getFullYear()
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(d)
}

/** "ноябрь 2026" / "November 2026" for a "YYYY-MM" key. */
export function formatMonth(key: string, lang: Lang): string {
  const d = parseISODate(`${key}-01`)
  if (!d) return key
  // Russian Intl appends " г." ("ноябрь 2026 г."); drop it for compact headers.
  const s = new Intl.DateTimeFormat(LOCALE[lang], { month: 'long', year: 'numeric' }).format(d).replace(/\s*г\.$/, '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
