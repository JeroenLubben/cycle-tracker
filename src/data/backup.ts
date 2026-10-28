// Versioned JSON export/import. This format is also how data moves to the future native app,
// so only ever add fields; bump SCHEMA_VERSION and migrate if a breaking change is unavoidable.

import type { Storage } from './storage'
import { DEFAULT_SETTINGS, type DayLog, type PeriodDay, type Settings } from './types'

export const SCHEMA_VERSION = 1

export interface Backup {
  schemaVersion: number
  exportedAt: string
  settings: Settings
  periodDays: PeriodDay[]
  dayLogs: DayLog[]
}

export async function createBackup(storage: Storage): Promise<Backup> {
  const [settings, periodDays, dayLogs] = await Promise.all([
    storage.getSettings(),
    storage.listPeriodDays(),
    storage.listDayLogs(),
  ])
  return { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), settings, periodDays, dayLogs }
}

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const FLOWS = ['spotting', 'light', 'medium', 'heavy']

/** Throws a readable error when the file is not a valid backup. */
export function parseBackup(json: string): Backup {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('This file is not a valid backup.')
  }
  const b = raw as Partial<Backup>
  if (typeof b !== 'object' || b === null || typeof b.schemaVersion !== 'number') {
    throw new Error('This file is not a valid backup.')
  }
  if (b.schemaVersion > SCHEMA_VERSION) {
    throw new Error('This backup was made by a newer version of the app.')
  }
  if (!Array.isArray(b.periodDays) || !b.periodDays.every((d) => isDate(d?.date) && FLOWS.includes(d?.flow))) {
    throw new Error('The period data in this backup is damaged.')
  }
  if (!Array.isArray(b.dayLogs) || !b.dayLogs.every((d) => isDate(d?.date))) {
    throw new Error('The daily logs in this backup are damaged.')
  }
  return {
    schemaVersion: b.schemaVersion,
    exportedAt: String(b.exportedAt ?? ''),
    settings: { ...DEFAULT_SETTINGS, ...b.settings },
    periodDays: b.periodDays,
    dayLogs: b.dayLogs.map((d) => ({ ...d, symptoms: Array.isArray(d.symptoms) ? d.symptoms : [] })),
  }
}

export async function restoreBackup(storage: Storage, backup: Backup): Promise<void> {
  await storage.replaceAll(backup)
}

export const backupFileName = (date: string) => `cycle-backup-${date}.json`
