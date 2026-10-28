import type { Mood } from '../data/types'

// Mouth shapes from very low (1) to great (5); matches the design system's MoodPicker.
const MOUTHS: Record<Mood, string> = {
  1: 'M15 27q5-4 10 0',
  2: 'M15 26h10',
  3: 'M15 25q5 3 10 0',
  4: 'M14.5 24q5.5 6 11 0',
  5: 'M14 23.5q6 9 12 0z',
}

export function MoodFace({ mood, size = 40 }: { mood: Mood; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="var(--color-today)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="11" r="5" fill="var(--phase-follicular)" />
      <circle cx="31" cy="11" r="5" fill="var(--phase-follicular)" />
      <ellipse cx="20" cy="22" rx="14" ry="12" fill="var(--phase-follicular)" />
      <circle cx="15" cy="19" r="1.3" fill="var(--color-text)" stroke="none" />
      <circle cx="25" cy="19" r="1.3" fill="var(--color-text)" stroke="none" />
      <path d={MOUTHS[mood]} stroke="var(--color-text)" fill={mood === 5 ? 'var(--color-text)' : 'none'} />
    </svg>
  )
}
