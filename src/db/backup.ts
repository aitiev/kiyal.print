/**
 * Backup / restore.
 * File: { app: "kyialprint", schemaVersion, exportedAt, data: { orders, expenses, ads, goals, settings } }
 * Restore modes:
 *  - replace: wipe all tables, then insert the file contents.
 *  - merge: upsert by id; on conflict the row with the newer `updatedAt` wins
 *    (settings: local values are kept, missing keys are added).
 * Device-local settings (PIN, lock timeout, last backup time) are never exported or restored.
 */
import { db, type KyialDB } from './schema'
import type { Ad, Expense, Goal, Order, SettingRow } from './types'
import { EXPENSE_CATEGORIES, GOAL_TYPES, PAYMENT_STATUSES, PRODUCTS, SOURCES, WORK_STATUSES } from './types'
import { isValidISODate, toISODate } from '@/lib/dates'
import { DEVICE_SETTING_KEYS } from './repositories/settings'

const isDeviceSetting = (r: { key: string }) => DEVICE_SETTING_KEYS.includes(r.key)

export const BACKUP_APP = 'kyialprint'
export const BACKUP_SCHEMA_VERSION = 1

export interface BackupData {
  orders: Order[]
  expenses: Expense[]
  ads: Ad[]
  goals: Goal[]
  settings: SettingRow[]
}
export interface BackupFile {
  app: typeof BACKUP_APP
  schemaVersion: number
  exportedAt: number
  data: BackupData
}
export type RestoreMode = 'merge' | 'replace'
export type DataTable = keyof BackupData
export const DATA_TABLES: DataTable[] = ['orders', 'expenses', 'ads', 'goals', 'settings']

export async function exportBackup(database: KyialDB = db, now = Date.now()): Promise<BackupFile> {
  const data = await database.transaction('r', database.orders, database.expenses, database.ads, database.goals, database.settings, async () => ({
    orders: await database.orders.toArray(),
    expenses: await database.expenses.toArray(),
    ads: await database.ads.toArray(),
    goals: await database.goals.toArray(),
    settings: (await database.settings.toArray()).filter((r) => !isDeviceSetting(r)),
  }))
  return { app: BACKUP_APP, schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: now, data }
}

export const serializeBackup = (b: BackupFile): string => JSON.stringify(b, null, 1)
export const backupFileName = (now = Date.now()) => `kyialprint-backup-${toISODate(now)}.json`

// ---------- validation ----------

export type BackupError =
  | { code: 'not_json' }
  | { code: 'not_backup' }
  | { code: 'newer_version'; version: number }
  | { code: 'invalid_row'; table: DataTable; index: number; field: string }

type Rec = Record<string, unknown>
const isObj = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x)
const isStr = (x: unknown) => typeof x === 'string'
const isNonEmptyStr = (x: unknown) => typeof x === 'string' && x.length > 0
const isNonNegInt = (x: unknown) => Number.isInteger(x) && (x as number) >= 0
const isTime = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x > 0
const isPosNum = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x > 0
const inList = (list: readonly string[]) => (x: unknown) => typeof x === 'string' && list.includes(x)
const optional = (f: (x: unknown) => boolean) => (x: unknown) => x === undefined || f(x)
const isBool = (x: unknown) => typeof x === 'boolean'

type Shape = Record<string, (x: unknown) => boolean>
const meta: Shape = { id: isNonEmptyStr, createdAt: isTime, updatedAt: isTime, demo: optional(isBool) }

const SHAPES: Record<DataTable, Shape> = {
  orders: {
    ...meta,
    childName: isStr,
    product: inList(PRODUCTS),
    topic: isStr,
    price: isNonNegInt,
    phone: optional(isStr),
    dueDate: optional(isValidISODate),
    extraPages: isNonNegInt,
    gift: isStr,
    paymentStatus: inList(PAYMENT_STATUSES),
    amountReceived: isNonNegInt,
    workStatus: inList(WORK_STATUSES),
    source: optional(inList(SOURCES)),
    notes: optional(isStr),
  },
  expenses: {
    ...meta,
    title: isStr,
    price: isNonNegInt,
    date: isValidISODate,
    qty: optional(isPosNum),
    unit: optional(isStr),
    category: inList(EXPENSE_CATEGORIES),
  },
  ads: { ...meta, title: isStr, channel: isStr, cost: isNonNegInt, date: isValidISODate, notes: optional(isStr) },
  goals: {
    id: inList(GOAL_TYPES),
    type: inList(GOAL_TYPES),
    targetAmount: optional(isNonNegInt),
    period: inList(['all_time', 'monthly']),
    updatedAt: isTime,
  },
  settings: { key: isNonEmptyStr, value: () => true },
}

export function validateBackup(raw: unknown): { ok: true; file: BackupFile } | { ok: false; error: BackupError } {
  let obj = raw
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw)
    } catch {
      return { ok: false, error: { code: 'not_json' } }
    }
  }
  if (!isObj(obj) || obj.app !== BACKUP_APP || !isObj(obj.data) || typeof obj.schemaVersion !== 'number')
    return { ok: false, error: { code: 'not_backup' } }
  if (obj.schemaVersion > BACKUP_SCHEMA_VERSION)
    return { ok: false, error: { code: 'newer_version', version: obj.schemaVersion } }

  const data = obj.data
  const out = {} as BackupData
  for (const table of DATA_TABLES) {
    const rows = data[table] ?? []
    if (!Array.isArray(rows)) return { ok: false, error: { code: 'not_backup' } }
    const shape = SHAPES[table]
    for (let i = 0; i < rows.length; i++) {
      const row: unknown = rows[i]
      if (!isObj(row)) return { ok: false, error: { code: 'invalid_row', table, index: i, field: '*' } }
      for (const [field, check] of Object.entries(shape)) {
        if (!check(row[field])) return { ok: false, error: { code: 'invalid_row', table, index: i, field } }
      }
    }
    // Keep only known fields (drops junk from hand-edited files).
    ;(out as unknown as Record<DataTable, unknown[]>)[table] = (rows as Rec[]).map((r) => pickKnown(r, shape))
  }
  return {
    ok: true,
    file: { app: BACKUP_APP, schemaVersion: obj.schemaVersion, exportedAt: Number(obj.exportedAt) || 0, data: out },
  }
}

function pickKnown(r: Rec, shape: Shape): Rec {
  const o: Rec = {}
  for (const k of Object.keys(shape)) if (r[k] !== undefined) o[k] = r[k]
  return o
}

// ---------- restore ----------

export interface RestoreStats {
  added: number
  updated: number
  skipped: number
}
export type RestoreReport = Record<DataTable, RestoreStats>

export async function restoreBackup(file: BackupFile, mode: RestoreMode, database: KyialDB = db): Promise<RestoreReport> {
  const report = Object.fromEntries(DATA_TABLES.map((t) => [t, { added: 0, updated: 0, skipped: 0 }])) as RestoreReport
  const tables = DATA_TABLES.map((t) => database.table(t))

  await database.transaction('rw', tables, async () => {
    if (mode === 'replace') {
      const keep = (await database.settings.toArray()).filter(isDeviceSetting)
      for (const t of tables) await t.clear()
      await database.settings.bulkAdd(keep)
      for (const name of DATA_TABLES) {
        const rows = name === 'settings' ? file.data.settings.filter((r) => !isDeviceSetting(r)) : file.data[name]
        await database.table(name).bulkAdd(rows)
        report[name].added = rows.length
      }
      return
    }
    for (const name of DATA_TABLES) {
      const table = database.table(name)
      const keyOf = (r: Rec) => (name === 'settings' ? r.key : r.id) as string
      const rows = (name === 'settings' ? file.data.settings.filter((r) => !isDeviceSetting(r)) : file.data[name]) as unknown as Rec[]
      const existing = await table.bulkGet(rows.map(keyOf))
      const toPut: Rec[] = []
      rows.forEach((row, i) => {
        const cur = existing[i] as Rec | undefined
        if (!cur) {
          toPut.push(row)
          report[name].added++
        } else if (name !== 'settings' && (row.updatedAt as number) > (cur.updatedAt as number)) {
          toPut.push(row)
          report[name].updated++
        } else report[name].skipped++
      })
      if (toPut.length) await table.bulkPut(toPut)
    }
  })
  return report
}

