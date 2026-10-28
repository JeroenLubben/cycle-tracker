import { useTranslation } from 'react-i18next'
import styles from './Stepper.module.css'

interface Props {
  label: string
  value: number
  min: number
  max: number
  onChange(value: number): void
}

/** A number of days with − and + buttons. */
export function Stepper({ label, value, min, max, onChange }: Props) {
  const { t } = useTranslation()
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button type="button" className={styles.step} aria-label={t('stepper.fewer')} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <output className={styles.value} aria-live="polite">
        <span className={styles.number}>{value}</span>
        <span className={styles.unit}>{t('stepper.days', { count: value })}</span>
      </output>
      <button type="button" className={styles.step} aria-label={t('stepper.more')} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  )
}
