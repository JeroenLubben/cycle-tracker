// Storage contract. The web app implements it with IndexedDB (./web/dexieStorage.ts);
// the native app will implement the same interface with SQLite.

import type { DayLog, ISODate, PeriodDay, Settings } from './types'

export interface Storage {
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>

  listPeriodDays(): Promise<PeriodDay[]>
  /** Pass `null` to clear the flow for that day. */
  setPeriodDay(date: ISODate, flow: PeriodDay['flow'] | null): Promise<void>

  getDayLog(date: ISODate): Promise<DayLog | undefined>
  listDayLogs(): Promise<DayLog[]>
  saveDayLog(log: DayLog): Promise<void>

  /** Replaces everything; used by import. */
  replaceAll(data: { settings: Settings; periodDays: PeriodDay[]; dayLogs: DayLog[] }): Promise<void>
  clearAll(): Promise<void>
}
