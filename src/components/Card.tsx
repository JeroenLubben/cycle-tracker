import type { ReactNode } from 'react'
import styles from './Card.module.css'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}

export function StatCard({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <Card>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        {accent && <span className={styles.dot} style={{ background: accent }} />}
        {value}
      </div>
    </Card>
  )
}
