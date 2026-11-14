import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './schema'
import { ordersRepo } from './repositories/orders'
import { expensesRepo } from './repositories/expenses'
import { adsRepo } from './repositories/ads'
import { goalsRepo } from './repositories/goals'
import { settingsRepo } from './repositories/settings'
import { exportBackup, restoreBackup, serializeBackup, validateBackup, backupFileName } from './backup'
import { buildDemoData, hasDemoData, removeDemoData, seedDemoData } from './seed'
import { newOrderDraft } from '@/lib/defaults'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

const T0 = new Date(2026, 10, 14, 10).getTime()

describe('repositories', () => {
  it('order CRUD, quick actions and undo', async () => {
    const o = await ordersRepo.create({ ...newOrderDraft(T0), childName: 'Айлин', topic: 'Космос', price: 80000, phone: undefined }, T0)
    expect(o.id).toBeTruthy()
    expect(Object.keys(o)).not.toContain('phone') // undefined stripped

    const half = await ordersRepo.setPayment(o.id, 'half', undefined, T0 + 1)
    expect(half).toMatchObject({ paymentStatus: 'half', amountReceived: 40000, updatedAt: T0 + 1 })
    const custom = await ordersRepo.setPayment(o.id, 'half', 99999999)
    expect(custom?.amountReceived).toBe(80000) // clamped to price
    expect((await ordersRepo.setPayment(o.id, 'paid'))?.amountReceived).toBe(80000)

    expect((await ordersRepo.advanceWork(o.id))?.workStatus).toBe('in_progress')
    await ordersRepo.advanceWork(o.id)
    await ordersRepo.advanceWork(o.id)
    expect(await ordersRepo.advanceWork(o.id)).toBeUndefined() // already delivered

    const edited = await ordersRepo.update(o.id, { ...newOrderDraft(T0), childName: 'Амина', topic: 'X', price: 1 }, T0 + 5)
    expect(edited).toMatchObject({ childName: 'Амина', createdAt: T0, updatedAt: T0 + 5 })

    const removed = await ordersRepo.remove(o.id)
    expect(await ordersRepo.list()).toHaveLength(0)
    await ordersRepo.restore(removed!)
    expect(await ordersRepo.get(o.id)).toEqual(edited)
  })

  it('lists newest first', async () => {
    await ordersRepo.create({ ...newOrderDraft(), childName: 'A', topic: 't', price: 1 }, 1000)
    await ordersRepo.create({ ...newOrderDraft(), childName: 'B', topic: 't', price: 1 }, 2000)
    expect((await ordersRepo.list()).map((o) => o.childName)).toEqual(['B', 'A'])
    await expensesRepo.create({ title: 'old', price: 1, date: '2026-01-01', category: 'paper' })
    await expensesRepo.create({ title: 'new', price: 1, date: '2026-02-01', category: 'paper' })
    expect((await expensesRepo.list()).map((e) => e.title)).toEqual(['new', 'old'])
  })

  it('goals and settings', async () => {
    await goalsRepo.set('monthly_income', 2000000, T0)
    expect(await goalsRepo.get('monthly_income')).toEqual({ id: 'monthly_income', type: 'monthly_income', period: 'monthly', targetAmount: 2000000, updatedAt: T0 })
    await goalsRepo.set('monthly_income', 3000000)
    expect(await goalsRepo.list()).toHaveLength(1)
    await settingsRepo.set('prefs', { lang: 'en' })
    expect(await settingsRepo.get('prefs')).toEqual({ lang: 'en' })
  })
})

async function fill() {
  await seedDemoData(db, T0)
  await ordersRepo.create({ ...newOrderDraft(T0), childName: 'Реальный', topic: 'Т', price: 50000, notes: 'многострочный\nтекст "кавычки" 😀' }, T0)
  await expensesRepo.create({ title: 'Плёнка', price: 90050, qty: 2.5, unit: 'м', date: '2026-11-01', category: 'printing' }, T0)
  await adsRepo.create({ title: 'Ad', channel: 'Telegram', cost: 50000, date: '2026-11-02', notes: 'n' }, T0)
  await goalsRepo.set('break_even', undefined, T0)
  await goalsRepo.set('monthly_income', 1000000, T0)
  await settingsRepo.set('prefs', { lang: 'ru', theme: 'dark', currency: 'KGS', currencySymbol: 'сом' })
}

describe('backup', () => {
  it('round-trips without data loss (export → JSON → validate → replace)', async () => {
    await fill()
    const before = await exportBackup(db, T0)
    const json = serializeBackup(before)
    await Promise.all(db.tables.map((t) => t.clear()))

    const v = validateBackup(json)
    expect(v.ok).toBe(true)
    if (!v.ok) return
    const report = await restoreBackup(v.file, 'replace')
    expect(report.orders.added).toBe(before.data.orders.length)

    const after = await exportBackup(db, T0)
    const sortById = <T extends { id?: string; key?: string }>(a: T[]) => [...a].sort((x, y) => String(x.id ?? x.key).localeCompare(String(y.id ?? y.key)))
    for (const t of ['orders', 'expenses', 'ads', 'goals', 'settings'] as const) {
      expect(sortById(after.data[t] as never[])).toEqual(sortById(before.data[t] as never[]))
    }
    expect(backupFileName(T0)).toBe('kyialprint-backup-2026-11-14.json')
  })

  it('merge: adds missing, newer updatedAt wins, keeps local settings', async () => {
    const a = await ordersRepo.create({ ...newOrderDraft(), childName: 'A', topic: 't', price: 100 }, 1000)
    const b = await ordersRepo.create({ ...newOrderDraft(), childName: 'B', topic: 't', price: 100 }, 1000)
    await settingsRepo.set('prefs', { lang: 'en' })
    const file = await exportBackup(db)

    // Local changes after the backup was taken
    await ordersRepo.update(a.id, { ...newOrderDraft(), childName: 'A-local-newer', topic: 't', price: 100 }, 5000)
    await ordersRepo.remove(b.id)
    // Backup holds a newer edit of nothing else + an extra row
    file.data.orders.push({ ...file.data.orders[0]!, id: 'extra', childName: 'Extra' })
    file.data.settings = [{ key: 'prefs', value: { lang: 'ru' } }, { key: 'pinHash', value: 'x' }]

    const report = await restoreBackup(file, 'merge')
    expect(report.orders).toEqual({ added: 2, updated: 0, skipped: 1 })
    expect((await ordersRepo.get(a.id))?.childName).toBe('A-local-newer')
    expect((await ordersRepo.get(b.id))?.childName).toBe('B') // restored
    expect(await ordersRepo.get('extra')).toBeTruthy()
    expect(await settingsRepo.get('prefs')).toEqual({ lang: 'en' })
    expect(await settingsRepo.get('pinHash')).toBeUndefined() // device-local: never restored

    // Newer row in the file overwrites the local one
    file.data.orders = [{ ...(await ordersRepo.get(a.id))!, childName: 'from-file', updatedAt: 9000 }]
    expect((await restoreBackup(file, 'merge')).orders.updated).toBe(1)
    expect((await ordersRepo.get(a.id))?.childName).toBe('from-file')
  })

  it('keeps device-local settings out of backups and through a replace restore', async () => {
    await fill()
    await settingsRepo.set('pinHash', { hash: 'local' })
    await settingsRepo.set('lockTimeoutMin', 5)
    const file = await exportBackup(db)
    expect(file.data.settings.map((r) => r.key)).not.toContain('pinHash')
    expect(file.data.settings.map((r) => r.key)).not.toContain('lockTimeoutMin')

    file.data.settings.push({ key: 'pinHash', value: { hash: 'from-file' } })
    await restoreBackup(file, 'replace')
    expect(await settingsRepo.get('pinHash')).toEqual({ hash: 'local' })
    expect(await settingsRepo.get('lockTimeoutMin')).toBe(5)
  })

  it('rejects invalid files with a precise error', async () => {
    expect(validateBackup('{nope')).toEqual({ ok: false, error: { code: 'not_json' } })
    expect(validateBackup({ foo: 1 })).toEqual({ ok: false, error: { code: 'not_backup' } })
    expect(validateBackup({ app: 'kyialprint', schemaVersion: 99, data: {} })).toEqual({ ok: false, error: { code: 'newer_version', version: 99 } })
    await fill()
    const file = await exportBackup(db)
    ;(file.data.orders[1] as unknown as Record<string, unknown>).price = 10.5
    expect(validateBackup(JSON.stringify(file))).toEqual({ ok: false, error: { code: 'invalid_row', table: 'orders', index: 1, field: 'price' } })
  })

  it('accepts missing tables and drops unknown fields', () => {
    const r = validateBackup({ app: 'kyialprint', schemaVersion: 1, exportedAt: 1, data: { ads: [{ id: 'x', title: 't', channel: 'c', cost: 1, date: '2026-01-01', createdAt: 1, updatedAt: 1, junk: true }] } })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.file.data.orders).toEqual([])
      expect(r.file.data.ads[0]).not.toHaveProperty('junk')
    }
  })
})

describe('demo data', () => {
  it('is deterministic, valid and removable without touching real rows', async () => {
    const d1 = buildDemoData(T0)
    const d2 = buildDemoData(T0)
    expect(d1.orders.map((o) => [o.childName, o.price])).toEqual(d2.orders.map((o) => [o.childName, o.price]))

    await fill()
    expect(await hasDemoData()).toBe(true)
    // seeded rows pass backup validation
    expect(validateBackup(await exportBackup(db)).ok).toBe(true)

    const removed = await removeDemoData()
    expect(removed).toBe(d1.orders.length + d1.expenses.length + d1.ads.length)
    expect(await hasDemoData()).toBe(false)
    expect((await ordersRepo.list()).map((o) => o.childName)).toEqual(['Реальный'])
    expect(await expensesRepo.list()).toHaveLength(1)
    expect(await adsRepo.list()).toHaveLength(1)
  })
})
