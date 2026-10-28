import { phaseRanges } from '../domain/cycle'
import { phaseColors } from '../theme/tokens'
import type { ReactNode } from 'react'
import styles from './CycleRing.module.css'

const R = 96
const C = 2 * Math.PI * R
const GAP = 4

interface Props {
  cycleLen: number
  periodLen: number
  cycleDay: number
  label: string
  children?: ReactNode
}

/** Four phase arcs with a marker on today; same geometry as the design system's CycleRing. */
export function CycleRing({ cycleLen, periodLen, cycleDay, label, children }: Props) {
  const ranges = phaseRanges(cycleLen, periodLen)
  const day = Math.min(cycleDay, cycleLen)
  const angle = (2 * Math.PI * (day - 0.5)) / cycleLen
  return (
    <div className={styles.ring} role="img" aria-label={label}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle cx="110" cy="110" r={R} fill="none" stroke="var(--color-surface-muted)" strokeWidth="10" />
        {ranges.map((r) => {
          const len = (C * (r.to - r.from + 1)) / cycleLen - GAP
          const offset = (C * (r.from - 1)) / cycleLen + GAP / 2
          return (
            <circle
              key={r.phase}
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke={phaseColors[r.phase]}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(len, 0.1)} ${C}`}
              strokeDashoffset={-offset}
            />
          )
        })}
        <circle cx={110 + R * Math.cos(angle)} cy={110 + R * Math.sin(angle)} r="9" fill="var(--color-surface)" stroke="var(--color-today)" strokeWidth="3" />
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  )
}
