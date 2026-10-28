import { createContext, useContext } from 'react'
import type { Flow, ISODate, PeriodDay, Settings } from '../data/types'

export interface AppData {
  loading: boolean
  settings: Settings
  periodDays: PeriodDay[]
  saveSettings(settings: Settings): Promise<void>
  /** Pass `null` to clear the flow for that day. */
  setFlow(date: ISODate, flow: Flow | null): Promise<void>
  reload(): Promise<void>
}

export const AppDataContext = createContext<AppData | null>(null)

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
