// Portable data model: shared with the future React Native app.
// Dates are local calendar days as ISO strings: "YYYY-MM-DD".

export type ISODate = string

export type Flow = 'spotting' | 'light' | 'medium' | 'heavy'

export type Mood = 1 | 2 | 3 | 4 | 5

export interface PeriodDay {
  date: ISODate
  flow: Flow
}

export interface DayLog {
  date: ISODate
  mood?: Mood
  sleepMinutes?: number
  note?: string
  symptoms: string[]
}

export interface Settings {
  avgCycleLen: number
  avgPeriodLen: number
  /** From onboarding; used until real period days are logged. */
  lastPeriodStart?: ISODate
  companionId: string
  onboarded: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  avgCycleLen: 28,
  avgPeriodLen: 5,
  companionId: 'bear',
  onboarded: false,
}

export const SYMPTOMS = ['cramps', 'headache', 'bloating', 'acne', 'tired', 'cravings', 'tender', 'backache'] as const
