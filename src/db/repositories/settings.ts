import { db } from '../schema'

/** Known setting keys (values are JSON-serialisable). */
export type SettingKey = 'prefs' | 'pinHash' | 'lockTimeoutMin' | 'lastBackupAt'

/** Per-device settings: never exported, ignored on restore, kept by a "replace" restore. */
export const DEVICE_SETTING_KEYS: readonly string[] = ['pinHash', 'lockTimeoutMin', 'lastBackupAt']

export const settingsRepo = {
  async get<T>(key: SettingKey): Promise<T | undefined> {
    return (await db.settings.get(key))?.value as T | undefined
  },
  set: (key: SettingKey, value: unknown) => db.settings.put({ key, value }),
  remove: (key: SettingKey) => db.settings.delete(key),
}
