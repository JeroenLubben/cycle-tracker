import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type PeriodDay, type Settings } from '../data/types'
import {
  averageCycleLength,
  averagePeriodLength,
  cycleStarts,
  getCycleStatus,
  groupPeriods,
  phaseForDay,
  phaseRanges,
  upcomingCycles,
} from './cycle'

const period = (start: string, len: number, flow: PeriodDay['flow'] = 'medium'): PeriodDay[] => {
  const d = new Date(`${start}T12:00:00`)
  return Array.from({ length: len }, (_, i) => {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    return { date: day.toISOString().slice(0, 10), flow }
  })
}

const settings = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...over })

describe('phases', () => {
  it('matches the mood board ranges for a 28-day cycle', () => {
    expect(phaseRanges(28, 5)).toEqual([
      { phase: 'menstruation', from: 1, to: 5 },
      { phase: 'follicular', from: 6, to: 13 },
      { phase: 'ovulation', from: 14, to: 16 },
      { phase: 'luteal', from: 17, to: 28 },
    ])
    expect(phaseForDay(23, 28, 5)).toBe('luteal')
  })

  it('keeps ovulation after the period in a very short cycle', () => {
    const ranges = phaseRanges(18, 6)
    expect(ranges.find((r) => r.phase === 'ovulation')!.from).toBe(7)
  })

  it('stays in luteal when the period is late', () => {
    expect(phaseForDay(33, 28, 5)).toBe('luteal')
  })
})

describe('grouping', () => {
  it('splits periods and ignores spotting', () => {
    const days = [...period('2026-08-01', 5), ...period('2026-08-15', 1, 'spotting'), ...period('2026-08-29', 4)]
    expect(groupPeriods(days).map((p) => [p[0], p.length])).toEqual([
      ['2026-08-01', 5],
      ['2026-08-29', 4],
    ])
  })

  it('handles a period spanning a month boundary', () => {
    const days = period('2026-09-29', 5)
    expect(groupPeriods(days)).toHaveLength(1)
    expect(averagePeriodLength(days, 99)).toBe(5)
  })
})

describe('averages', () => {
  it('uses the fallback with no data or a single cycle', () => {
    expect(averageCycleLength([], 28)).toBe(28)
    expect(averageCycleLength(['2026-10-01'], 30)).toBe(30)
  })

  it('averages irregular cycles over the last six', () => {
    // lengths: 40, 26, 30, 28, 32, 27, 29 → last six average to 28.67 → 29
    const starts = ['2026-01-01', '2026-02-10', '2026-03-08', '2026-04-07', '2026-05-05', '2026-06-06', '2026-07-03', '2026-08-01']
    expect(averageCycleLength(starts, 28)).toBe(29)
  })

  it('uses the onboarding start until real data exists', () => {
    expect(cycleStarts([], { lastPeriodStart: '2026-10-01' })).toEqual(['2026-10-01'])
    // A logged period near the onboarding date replaces it.
    expect(cycleStarts(period('2026-10-02', 4), { lastPeriodStart: '2026-10-01' })).toEqual(['2026-10-02'])
  })
})

describe('getCycleStatus', () => {
  it('returns null without any data', () => {
    expect(getCycleStatus('2026-10-16', [], settings())).toBeNull()
  })

  it('reproduces the mood board: day 23, luteal', () => {
    const s = getCycleStatus('2026-10-16', period('2026-09-24', 5), settings())!
    expect(s.cycleDay).toBe(23)
    expect(s.phase).toBe('luteal')
    expect(s.nextPeriodStart).toBe('2026-10-22')
    expect(s.daysUntilNextPeriod).toBe(6)
    expect(s.current.fertileStart).toBe('2026-10-02')
    expect(s.current.ovulation).toBe('2026-10-07')
  })

  it('works from onboarding settings alone', () => {
    const s = getCycleStatus('2026-10-10', [], settings({ lastPeriodStart: '2026-10-01', avgCycleLen: 30 }))!
    expect(s.cycleDay).toBe(10)
    expect(s.nextPeriodStart).toBe('2026-10-31')
  })

  it('reports a late period as negative days and predicts from today', () => {
    const s = getCycleStatus('2026-10-05', period('2026-09-01', 5), settings())!
    expect(s.daysUntilNextPeriod).toBe(-6)
    expect(upcomingCycles(s, '2026-10-05', 1)[0].start).toBe('2026-10-05')
  })

  it('ignores future-dated entries', () => {
    const s = getCycleStatus('2026-10-16', [...period('2026-10-01', 5), ...period('2026-11-01', 5)], settings())!
    expect(s.lastStart).toBe('2026-10-01')
  })
})
