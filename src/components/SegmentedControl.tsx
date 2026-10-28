import styles from './SegmentedControl.module.css'

interface Props<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange(value: T): void
}

export function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className={styles.track} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={styles.segment}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
