import { describe, expect, it } from 'vitest'
import { translate, translatePlural, dictionaries } from './index'

function keys(o: object, p = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${p}${k}`] : keys(v as object, `${p}${k}.`),
  )
}

describe('i18n', () => {
  it('ru and en have identical key sets', () => {
    expect(keys(dictionaries.en).sort()).toEqual(keys(dictionaries.ru).sort())
  })
  it('translates and interpolates', () => {
    expect(translate('en', 'tabs.orders')).toBe('Orders')
    expect(translate('ru', 'tabs.orders')).toBe('Заказы')
  })
  it('pluralises Russian correctly', () => {
    expect(translatePlural('ru', 'orders.count', 1)).toBe('1 заказ')
    expect(translatePlural('ru', 'orders.count', 3)).toBe('3 заказа')
    expect(translatePlural('ru', 'orders.count', 5)).toBe('5 заказов')
    expect(translatePlural('ru', 'orders.count', 21)).toBe('21 заказ')
    expect(translatePlural('en', 'orders.count', 2)).toBe('2 orders')
  })
})
