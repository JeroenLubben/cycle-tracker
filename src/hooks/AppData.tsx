import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { storage } from '../data/web'
import { DEFAULT_SETTINGS, type Flow, type ISODate, type PeriodDay, type Settings } from '../data/types'
import { AppDataContext } from './appDataContext'

const load = () => Promise.all([storage.getSettings(), storage.listPeriodDays()])

/** Loads settings and period days once and shares them with every screen. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<{ loading: boolean; settings: Settings; periodDays: PeriodDay[] }>({
    loading: true,
    settings: DEFAULT_SETTINGS,
    periodDays: [],
  })

  const reload = useCallback(async () => {
    const [settings, periodDays] = await load()
    setData({ loading: false, settings, periodDays })
  }, [])

  const saveSettings = useCallback(async (settings: Settings) => {
    await storage.saveSettings(settings)
    setData((d) => ({ ...d, settings }))
  }, [])

  const setFlow = useCallback(async (date: ISODate, flow: Flow | null) => {
    await storage.setPeriodDay(date, flow)
    setData((d) => {
      const rest = d.periodDays.filter((p) => p.date !== date)
      const periodDays = flow ? [...rest, { date, flow }].sort((a, b) => a.date.localeCompare(b.date)) : rest
      return { ...d, periodDays }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    void load().then(([settings, periodDays]) => {
      if (!cancelled) setData({ loading: false, settings, periodDays })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({ ...data, saveSettings, setFlow, reload }), [data, saveSettings, setFlow, reload])
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
