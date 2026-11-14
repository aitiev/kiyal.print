import { describe, expect, it } from 'vitest'
import { divideMinor, formatMoney, fromMinor, parseDecimal, parseMoney, percentOf, roundToMajor, sumMinor, toInputString, toMinor } from './money'

describe('money', () => {
  it('converts without float drift', () => {
    expect(toMinor(0.1 + 0.2)).toBe(30)
    expect(toMinor(19.99)).toBe(1999)
    expect(fromMinor(1999)).toBe(19.99)
    expect(sumMinor([10, 20, 30.4])).toBe(60)
  })
  it('parses user input', () => {
    expect(parseMoney('800')).toBe(80000)
    expect(parseMoney('1 200,50')).toBe(120050)
    expect(parseMoney('1 200.5')).toBe(120050)
    expect(parseMoney('0,05')).toBe(5)
    expect(parseMoney(',5')).toBe(50)
    expect(parseMoney('12.')).toBe(1200)
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('-5')).toBeNull()
    expect(parseMoney('1.234')).toBeNull()
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('1,2,3')).toBeNull()
  })
  it('parses decimals', () => {
    expect(parseDecimal('2,5')).toBe(2.5)
    expect(parseDecimal('500')).toBe(500)
    expect(parseDecimal('x')).toBeNull()
  })
  it('percent and divide round to whole minor units', () => {
    expect(percentOf(80000, 50)).toBe(40000)
    expect(percentOf(99, 50)).toBe(50)
    expect(divideMinor(65000, 500)).toBe(130)
    expect(divideMinor(100, 3)).toBe(33)
    expect(divideMinor(100, 0)).toBeNull()
  })
  it('formats with a symbol override', () => {
    expect(formatMoney(120000, { lang: 'ru', currency: 'KGS', symbol: 'сом' }).replace(/\s/g, ' ')).toBe('1 200 сом')
    expect(formatMoney(120050, { lang: 'en', currency: 'KGS', symbol: 'som' }).replace(/\s/g, ' ')).toBe('1,200.50 som')
    expect(formatMoney(-30000, { lang: 'en', currency: 'KGS', symbol: 'som' }).replace(/\s/g, ' ')).toBe('-300 som')
  })
  it('formats via Intl currency when no symbol', () => {
    expect(formatMoney(150000, { lang: 'en', currency: 'USD' })).toBe('US$1,500')
    expect(formatMoney(100, { lang: 'en', currency: 'NOPE' })).toMatch(/1.*NOPE/)
  })
  it('makes input strings', () => {
    expect(toInputString(120050, 'ru')).toBe('1200,5')
    expect(toInputString(120050, 'en')).toBe('1200.5')
    expect(toInputString(80000, 'ru')).toBe('800')
    expect(toInputString(undefined, 'ru')).toBe('')
  })
})

describe('roundToMajor', () => {
  it('rounds to whole som', () => {
    expect(roundToMajor(96409)).toBe(96400)
    expect(roundToMajor(96450)).toBe(96500)
    expect(roundToMajor(0)).toBe(0)
  })
})
