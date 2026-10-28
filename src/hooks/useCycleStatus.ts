import { useMemo, useState } from 'react'
import { getCycleStatus, toISO } from '../domain/cycle'
import { useAppData } from './appDataContext'

export function useCycleStatus() {
  const { loading, settings, periodDays } = useAppData()
  const [today] = useState(() => toISO(new Date()))
  const status = useMemo(() => getCycleStatus(today, periodDays, settings), [today, periodDays, settings])
  return { loading, settings, status }
}
