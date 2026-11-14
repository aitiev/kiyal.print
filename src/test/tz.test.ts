import { expect, it } from 'vitest'
it('runs tests in a fixed timezone (Asia/Bishkek, UTC+6)', () => {
  expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-360)
})
