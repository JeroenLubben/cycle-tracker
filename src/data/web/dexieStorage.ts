import Dexie, { type EntityTable } from 'dexie'
import type { Storage } from '../storage'
import { DEFAULT_SETTINGS, type DayLog, type PeriodDay, type Settings } from '../types'

interface SettingsRow extends Settings {
  id: 'settings'
}

class CycleDB extends Dexie {
  periodDays!: EntityTable<PeriodDay, 'date'>
  dayLogs!: EntityTable<DayLog, 'date'>
  settings!: EntityTable<SettingsRow, 'id'>

  constructor(name: string) {
    super(name)
    this.version(1).stores({ periodDays: 'date', dayLogs: 'date', settings: 'id' })
  }
}

export function createDexieStorage(name = 'cycle-tracker'): Storage {
  const db = new CycleDB(name)

  return {
    async getSettings() {
      const row = await db.settings.get('settings')
      if (!row) return { ...DEFAULT_SETTINGS }
      const { id: _id, ...settings } = row
      return { ...DEFAULT_SETTINGS, ...settings }
    },
    async saveSettings(settings) {
      await db.settings.put({ ...settings, id: 'settings' })
    },

    listPeriodDays: () => db.periodDays.orderBy('date').toArray(),
    async setPeriodDay(date, flow) {
      if (flow) await db.periodDays.put({ date, flow })
      else await db.periodDays.delete(date)
    },

    getDayLog: (date) => db.dayLogs.get(date),
    listDayLogs: () => db.dayLogs.orderBy('date').toArray(),
    async saveDayLog(log) {
      await db.dayLogs.put(log)
    },

    async replaceAll({ settings, periodDays, dayLogs }) {
      await db.transaction('rw', db.periodDays, db.dayLogs, db.settings, async () => {
        await Promise.all([db.periodDays.clear(), db.dayLogs.clear(), db.settings.clear()])
        await db.periodDays.bulkPut(periodDays)
        await db.dayLogs.bulkPut(dayLogs)
        await db.settings.put({ ...settings, id: 'settings' })
      })
    },
    async clearAll() {
      await db.transaction('rw', db.periodDays, db.dayLogs, db.settings, async () => {
        await Promise.all([db.periodDays.clear(), db.dayLogs.clear(), db.settings.clear()])
      })
    },
  }
}

/** Asks the browser not to evict our data under storage pressure (best effort). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
