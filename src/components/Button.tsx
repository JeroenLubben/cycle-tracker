import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' }

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  return <button type="button" className={`${styles.button} ${styles[variant]} ${className}`} {...rest} />
}
