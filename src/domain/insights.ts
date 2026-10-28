// Pure insight maths over logged data. No browser or React imports (portable to the native app).
// The thresholds below are deliberately cautious so the app does not report patterns that are noise.

import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { DayLog, ISODate, PeriodDay, Settings } from '../data/types'
import { averageCycleLength, averagePeriodLength, cycleStarts, groupPeriods, phaseForDay, type Phase } from './cycle'

export const PHASES: Phase[] = ['menstruation', 'follicular', 'ovulation', 'luteal']

/** A phase needs this many logged days before its mood or symptom figures are shown. */
export const MIN_DAYS = 3
/** Patterns are only reported once this many complete cycles exist. */
export const MIN_COMPLETE_CYCLES = 2
/** A symptom must be at least this many times more common in one phase than in the others. */
const PATTERN_RATIO = 2

const diff = (a: ISODate, b: ISODate) => differenceInCalendarDays(parseISO(a), parseISO(b))

export interface CycleRecord {
  start: ISODate
  /** null while the cycle is still going. */
  length: number | null
  /** null when no bleeding was logged for this cycle (e.g. the onboarding date). */
  periodLength: number | null
}

/** Every known cycle, oldest first. */
export function cycleHistory(days: PeriodDay[], settings: Settings, today: ISODate): CycleRecord[] {
  const starts = cycleStarts(days, settings).filter((s) => s <= today)
  const periods = groupPeriods(days)
  return starts.map((start, i) => {
    const period = periods.find((p) => p[0] === start)
    return {
      start,
      length: i + 1 < starts.length ? diff(starts[i + 1], start) : null,
      periodLength: period ? diff(period.at(-1)!, period[0]) + 1 : null,
    }
  })
}

export type PhaseLookup = (date: ISODate) => Phase | null

/** Phase of any past date, using each cycle's actual length once it is complete. */
export function phaseLookup(history: CycleRecord[], days: PeriodDay[], settings: Settings, today: ISODate): PhaseLookup {
  const avgCycle = averageCycleLength(history.map((c) => c.start), settings.avgCycleLen)
  const avgPeriod = averagePeriodLength(days, settings.avgPeriodLen, today)
  return (date) => {
    const cycle = history.findLast((c) => c.start <= date)
    if (!cycle) return null
    return phaseForDay(diff(date, cycle.start) + 1, cycle.length ?? avgCycle, cycle.periodLength ?? avgPeriod)
  }
}

export interface MoodSummary {
  average: number
  count: number
}

export function moodByPhase(logs: DayLog[], phaseOf: PhaseLookup): Partial<Record<Phase, MoodSummary>> {
  const out: Partial<Record<Phase, MoodSummary>> = {}
  for (const phase of PHASES) {
    const moods = logs.filter((l) => l.mood && phaseOf(l.date) === phase).map((l) => l.mood!)
    if (moods.length) out[phase] = { average: moods.reduce((a, b) => a + b, 0) / moods.length, count: moods.length }
  }
  return out
}

export interface SymptomCounts {
  /** Logged days in each phase (any entry counts). */
  logged: Record<Phase, number>
  /** For each symptom, the number of days it was logged in each phase. */
  bySymptom: Record<string, Record<Phase, number>>
}

const zero = (): Record<Phase, number> => ({ menstruation: 0, follicular: 0, ovulation: 0, luteal: 0 })

export function symptomsByPhase(logs: DayLog[], phaseOf: PhaseLookup): SymptomCounts {
  const logged = zero()
  const bySymptom: Record<string, Record<Phase, number>> = {}
  for (const log of logs) {
    const phase = phaseOf(log.date)
    if (!phase) continue
    logged[phase]++
    for (const s of log.symptoms) (bySymptom[s] ??= zero())[phase]++
  }
  return { logged, bySymptom }
}

export interface Pattern {
  kind: 'symptom' | 'lowMood'
  /** The symptom; empty for mood patterns. */
  key: string
  phase: Phase
}

/** Up to `max` patterns, strongest first. Empty until there are enough complete cycles. */
export function findPatterns(
  counts: SymptomCounts,
  moods: Partial<Record<Phase, MoodSummary>>,
  completeCycles: number,
  max = 3,
): Pattern[] {
  if (completeCycles < MIN_COMPLETE_CYCLES) return []
  const found: { pattern: Pattern; strength: number }[] = []

  for (const [symptom, perPhase] of Object.entries(counts.bySymptom)) {
    for (const phase of PHASES) {
      const days = perPhase[phase]
      const logged = counts.logged[phase]
      const otherDays = PHASES.filter((p) => p !== phase).reduce((n, p) => n + perPhase[p], 0)
      const otherLogged = PHASES.filter((p) => p !== phase).reduce((n, p) => n + counts.logged[p], 0)
      if (days < MIN_DAYS || otherLogged < MIN_DAYS) continue
      const rate = days / logged
      const otherRate = otherDays / otherLogged
      if (rate >= PATTERN_RATIO * otherRate) found.push({ pattern: { kind: 'symptom', key: symptom, phase }, strength: rate - otherRate })
    }
  }

  // A phase whose average mood is at least one face lower than the rest.
  for (const phase of PHASES) {
    const here = moods[phase]
    const others = PHASES.filter((p) => p !== phase).map((p) => moods[p]).filter((m): m is MoodSummary => !!m && m.count >= MIN_DAYS)
    if (!here || here.count < MIN_DAYS || !others.length) continue
    const otherAvg = others.reduce((n, m) => n + m.average * m.count, 0) / others.reduce((n, m) => n + m.count, 0)
    if (otherAvg - here.average >= 1) found.push({ pattern: { kind: 'lowMood', key: '', phase }, strength: (otherAvg - here.average) / 4 })
  }

  return found
    .sort((a, b) => b.strength - a.strength)
    .slice(0, max)
    .map((f) => f.pattern)
}
