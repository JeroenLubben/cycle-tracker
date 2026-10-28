// Pure cycle maths. No browser or React imports, so the native app can reuse it as-is.
// Uses the standard calendar-method estimates; this is not medical advice.

import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { ISODate, PeriodDay, Settings } from '../data/types'

export type Phase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal'

/** Bleeding days closer together than this belong to the same period. */
const SAME_PERIOD_MAX_GAP = 7
/** Number of recent cycles used for the average. */
const AVERAGE_WINDOW = 6
/** Days from ovulation to the next period (luteal phase length). */
const LUTEAL_DAYS = 14

export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd')
const diff = (a: ISODate, b: ISODate) => differenceInCalendarDays(parseISO(a), parseISO(b))
const plus = (d: ISODate, n: number) => toISO(addDays(parseISO(d), n))

const bleedingDates = (days: PeriodDay[]): ISODate[] =>
  [...new Set(days.filter((d) => d.flow !== 'spotting').map((d) => d.date))].sort()

/** Groups bleeding days into periods: [[start, ..., end], ...] sorted by date. */
export function groupPeriods(days: PeriodDay[]): ISODate[][] {
  const periods: ISODate[][] = []
  for (const date of bleedingDates(days)) {
    const current = periods.at(-1)
    if (current && diff(date, current.at(-1)!) <= SAME_PERIOD_MAX_GAP) current.push(date)
    else periods.push([date])
  }
  return periods
}

export function cycleStarts(days: PeriodDay[], settings: Pick<Settings, 'lastPeriodStart'>): ISODate[] {
  const starts = groupPeriods(days).map((p) => p[0])
  const fallback = settings.lastPeriodStart
  if (fallback && (starts.length === 0 || diff(starts[0], fallback) > SAME_PERIOD_MAX_GAP)) starts.unshift(fallback)
  return starts
}

const average = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)

export function averageCycleLength(starts: ISODate[], fallback: number): number {
  const lengths = starts.slice(1).map((s, i) => diff(s, starts[i]))
  return lengths.length ? average(lengths.slice(-AVERAGE_WINDOW)) : fallback
}

/** With `today`, a period whose last logged day is today or yesterday may still be going, so it is left out. */
export function averagePeriodLength(days: PeriodDay[], fallback: number, today?: ISODate): number {
  const finished = groupPeriods(days).filter((p) => !today || diff(today, p.at(-1)!) > 1)
  const lengths = finished.map((p) => diff(p.at(-1)!, p[0]) + 1)
  return lengths.length ? average(lengths.slice(-AVERAGE_WINDOW)) : fallback
}

/** 1-based cycle day on which ovulation is estimated. */
export const ovulationDay = (cycleLen: number, periodLen: number) => Math.max(periodLen + 1, cycleLen - LUTEAL_DAYS)

export interface PhaseRange {
  phase: Phase
  from: number
  to: number
}

/** Phase day ranges for one cycle, e.g. 28/5 → 1–5, 6–13, 14–16, 17–28. */
export function phaseRanges(cycleLen: number, periodLen: number): PhaseRange[] {
  const ov = ovulationDay(cycleLen, periodLen)
  const ovEnd = Math.min(ov + 2, cycleLen)
  const ranges: PhaseRange[] = [
    { phase: 'menstruation', from: 1, to: periodLen },
    { phase: 'follicular', from: periodLen + 1, to: ov - 1 },
    { phase: 'ovulation', from: ov, to: ovEnd },
    { phase: 'luteal', from: ovEnd + 1, to: cycleLen },
  ]
  return ranges.filter((r) => r.from <= r.to)
}

export function phaseForDay(cycleDay: number, cycleLen: number, periodLen: number): Phase {
  const ranges = phaseRanges(cycleLen, periodLen)
  return (ranges.find((r) => cycleDay >= r.from && cycleDay <= r.to) ?? ranges.at(-1)!).phase
}

export interface PredictedCycle {
  start: ISODate
  periodEnd: ISODate
  fertileStart: ISODate
  fertileEnd: ISODate
  ovulation: ISODate
}

function predictFrom(start: ISODate, cycleLen: number, periodLen: number): PredictedCycle {
  const ov = ovulationDay(cycleLen, periodLen) - 1
  return {
    start,
    periodEnd: plus(start, periodLen - 1),
    fertileStart: plus(start, Math.max(periodLen, ov - 5)),
    fertileEnd: plus(start, ov + 1),
    ovulation: plus(start, ov),
  }
}

export interface CycleStatus {
  lastStart: ISODate
  cycleDay: number
  phase: Phase
  cycleLen: number
  periodLen: number
  nextPeriodStart: ISODate
  /** Negative when the period is late. */
  daysUntilNextPeriod: number
  current: PredictedCycle
}

/** Returns null when there is nothing to base a prediction on yet. */
export function getCycleStatus(today: ISODate, days: PeriodDay[], settings: Settings): CycleStatus | null {
  const starts = cycleStarts(days, settings).filter((s) => s <= today)
  const lastStart = starts.at(-1)
  if (!lastStart) return null

  const cycleLen = averageCycleLength(starts, settings.avgCycleLen)
  const periodLen = averagePeriodLength(days, settings.avgPeriodLen, today)
  const cycleDay = diff(today, lastStart) + 1
  const nextPeriodStart = plus(lastStart, cycleLen)

  return {
    lastStart,
    cycleDay,
    phase: phaseForDay(cycleDay, cycleLen, periodLen),
    cycleLen,
    periodLen,
    nextPeriodStart,
    daysUntilNextPeriod: diff(nextPeriodStart, today),
    current: predictFrom(lastStart, cycleLen, periodLen),
  }
}

/** The next `count` predicted cycles after the current one, for the calendar. */
export function upcomingCycles(status: CycleStatus, today: ISODate, count = 3): PredictedCycle[] {
  // When the period is late, predict from today instead of from a date in the past.
  const first = status.daysUntilNextPeriod < 0 ? today : status.nextPeriodStart
  return Array.from({ length: count }, (_, i) =>
    predictFrom(plus(first, i * status.cycleLen), status.cycleLen, status.periodLen),
  )
}

export type DayMark = 'period' | 'spotting' | 'predicted' | 'fertile'

const eachDay = (from: ISODate, to: ISODate): ISODate[] =>
  Array.from({ length: Math.max(0, diff(to, from) + 1) }, (_, i) => plus(from, i))

/**
 * One mark per date for the calendar. Logged days win over predictions;
 * predicted periods are only shown from today onwards.
 */
export function calendarMarks(days: PeriodDay[], status: CycleStatus | null, today: ISODate, count = 3): Map<ISODate, DayMark> {
  const marks = new Map<ISODate, DayMark>()
  if (status) {
    const cycles = [status.current, ...upcomingCycles(status, today, count)]
    for (const c of cycles) for (const d of eachDay(c.fertileStart, c.fertileEnd)) marks.set(d, 'fertile')
    // Includes the rest of the current period, e.g. after logging only its first day.
    for (const c of cycles) {
      for (const d of eachDay(c.start, c.periodEnd)) if (d >= today) marks.set(d, 'predicted')
    }
  }
  for (const d of days) marks.set(d.date, d.flow === 'spotting' ? 'spotting' : 'period')
  return marks
}
