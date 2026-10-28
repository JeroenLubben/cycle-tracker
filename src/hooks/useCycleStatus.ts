import { useEffect, useState } from 'react'
import { storage } from '../data/web'
import { DEFAULT_SETTINGS, type Settings } from '../data/types'
import { getCycleStatus, toISO, type CycleStatus } from '../domain/cycle'

export function useCycleStatus() {
  const [state, setState] = useState<{ loading: boolean; settings: Settings; status: CycleStatus | null }>({
    loading: true,
    settings: DEFAULT_SETTINGS,
    status: null,
  })

  useEffect(() => {
    let cancelled = false
    void Promise.all([storage.getSettings(), storage.listPeriodDays()]).then(([settings, days]) => {
      if (!cancelled) setState({ loading: false, settings, status: getCycleStatus(toISO(new Date()), days, settings) })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
