import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup, restoreBackup } from './backup'
import { createDexieStorage } from './web/dexieStorage'

describe('backup', () => {
  it('round-trips export → delete all → import', async () => {
    const storage = createDexieStorage('backup-test')
    await storage.saveSettings({ avgCycleLen: 30, avgPeriodLen: 4, companionId: 'bear', onboarded: true, lastPeriodStart: '2026-10-01' })
    await storage.setPeriodDay('2026-10-01', 'heavy')
    await storage.setPeriodDay('2026-10-02', 'light')
    await storage.saveDayLog({ date: '2026-10-02', mood: 4, sleepMinutes: 450, note: 'tired 🧸', symptoms: ['cramps'] })

    const json = JSON.stringify(await createBackup(storage))
    await storage.clearAll()
    expect(await storage.listPeriodDays()).toEqual([])

    await restoreBackup(storage, parseBackup(json))
    const restored = await createBackup(storage)
    const original = JSON.parse(json)
    expect({ ...restored, exportedAt: '' }).toEqual({ ...original, exportedAt: '' })
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('hello')).toThrow('not a valid backup')
    expect(() => parseBackup('{"schemaVersion":99,"periodDays":[],"dayLogs":[]}')).toThrow('newer version')
    expect(() => parseBackup('{"schemaVersion":1,"periodDays":[{"date":"x","flow":"heavy"}],"dayLogs":[]}')).toThrow('damaged')
  })
})
