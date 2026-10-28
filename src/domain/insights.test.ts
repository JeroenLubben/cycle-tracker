import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type DayLog, type PeriodDay, type Settings } from '../data/types'
import { cycleHistory, findPatterns, moodByPhase, phaseLookup, symptomsByPhase } from './insights'

const period = (start: string, len: number): PeriodDay[] => {
  const d = new Date(`${start}T12:00:00`)
  return Array.from({ length: len }, (_, i) => {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    return { date: day.toISOString().slice(0, 10), flow: 'medium' as const }
  })
}
const settings = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...over })
const log = (date: string, symptoms: string[] = [], mood?: DayLog['mood']): DayLog => ({ date, symptoms, mood })

const TODAY = '2026-09-10'
const DAYS = [...period('2026-07-01', 5), ...period('2026-07-29', 5), ...period('2026-08-26', 4)]

function setup(logs: DayLog[], days = DAYS, s = settings()) {
  const history = cycleHistory(days, s, TODAY)
  const phaseOf = phaseLookup(history, days, s, TODAY)
  const counts = symptomsByPhase(logs, phaseOf)
  const moods = moodByPhase(logs, phaseOf)
  return { history, phaseOf, counts, moods, complete: history.filter((c) => c.length !== null).length }
}

describe('cycleHistory', () => {
  it('is empty without data', () => {
    expect(cycleHistory([], settings(), TODAY)).toEqual([])
  })

  it('lists complete and ongoing cycles with period lengths', () => {
    expect(cycleHistory(DAYS, settings(), TODAY)).toEqual([
      { start: '2026-07-01', length: 28, periodLength: 5 },
      { start: '2026-07-29', length: 28, periodLength: 5 },
      { start: '2026-08-26', length: null, periodLength: 4 },
    ])
  })

  it('keeps the onboarding start without a period length', () => {
    expect(cycleHistory([], settings({ lastPeriodStart: '2026-09-01' }), TODAY)).toEqual([
      { start: '2026-09-01', length: null, periodLength: null },
    ])
  })
})

describe('phaseLookup', () => {
  it('returns null before the first cycle and uses actual cycle lengths', () => {
    const { phaseOf } = setup([])
    expect(phaseOf('2026-06-30')).toBeNull()
    expect(phaseOf('2026-07-03')).toBe('menstruation')
    expect(phaseOf('2026-07-08')).toBe('follicular')
    expect(phaseOf('2026-07-14')).toBe('ovulation')
    expect(phaseOf('2026-07-25')).toBe('luteal')
  })

  it('handles irregular complete cycles', () => {
    const days = [...period('2026-07-01', 5), ...period('2026-08-05', 5)] // a 35-day cycle
    const { phaseOf } = setup([], days)
    // Ovulation is estimated 14 days before the next start: cycle day 21.
    expect(phaseOf('2026-07-21')).toBe('ovulation')
    expect(phaseOf('2026-07-15')).toBe('follicular')
  })
})

describe('moods and symptoms by phase', () => {
  it('averages mood and counts symptoms per phase', () => {
    const { moods, counts } = setup([log('2026-07-02', ['cramps'], 2), log('2026-07-03', ['cramps'], 3), log('2026-07-20', ['tired'], 4)])
    expect(moods.menstruation).toEqual({ average: 2.5, count: 2 })
    expect(moods.luteal).toEqual({ average: 4, count: 1 })
    expect(counts.logged.menstruation).toBe(2)
    expect(counts.bySymptom.cramps.menstruation).toBe(2)
    expect(counts.bySymptom.tired.luteal).toBe(1)
  })
})

describe('findPatterns', () => {
  const luteal = ['2026-07-20', '2026-07-22', '2026-07-25', '2026-08-18', '2026-08-20']
  const follicular = ['2026-07-08', '2026-07-10', '2026-08-05', '2026-08-07', '2026-08-09']

  it('finds a symptom that is much more common in one phase', () => {
    const logs = [...luteal.map((d) => log(d, ['tired'])), ...follicular.map((d, i) => log(d, i === 0 ? ['tired'] : []))]
    const { counts, moods, complete } = setup(logs)
    expect(findPatterns(counts, moods, complete)).toEqual([{ kind: 'symptom', key: 'tired', phase: 'luteal' }])
  })

  it('reports nothing before two complete cycles', () => {
    const logs = luteal.map((d) => log(d, ['tired']))
    const { counts, moods } = setup(logs)
    expect(findPatterns(counts, moods, 1)).toEqual([])
  })

  it('ignores symptoms that are about as common everywhere', () => {
    const logs = [...luteal.map((d) => log(d, ['headache'])), ...follicular.map((d, i) => log(d, i < 3 ? ['headache'] : []))]
    const { counts, moods, complete } = setup(logs)
    expect(findPatterns(counts, moods, complete)).toEqual([])
  })

  it('finds a phase with clearly lower mood', () => {
    const logs = [...luteal.map((d) => log(d, [], 2)), ...follicular.map((d) => log(d, [], 4))]
    const { counts, moods, complete } = setup(logs)
    expect(findPatterns(counts, moods, complete)).toEqual([{ kind: 'lowMood', key: '', phase: 'luteal' }])
  })
})
