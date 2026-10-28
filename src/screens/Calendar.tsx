import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Card } from '../components/Card'
import { CompanionImage } from '../components/CompanionImage'
import { Icon } from '../components/Icon'
import { calendarMarks, toISO } from '../domain/cycle'
import { useAppData } from '../hooks/appDataContext'
import { useCycleStatus } from '../hooks/useCycleStatus'
import styles from './Calendar.module.css'

const WEEK = { weekStartsOn: 1 } as const

export function Calendar() {
  const { t } = useTranslation()
  const { periodDays } = useAppData()
  const { settings, status } = useCycleStatus()
  const [today] = useState(() => toISO(new Date()))
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const marks = useMemo(() => calendarMarks(periodDays, status, today, 6), [periodDays, status, today])
  const days = eachDayOfInterval({ start: startOfWeek(month, WEEK), end: endOfWeek(endOfMonth(month), WEEK) })
  const weekdays = days.slice(0, 7).map((d) => format(d, 'EEEEE'))

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.nav} aria-label={t('calendar.previous')} onClick={() => setMonth(addMonths(month, -1))}>
          <Icon name="back" />
        </button>
        <h1>{format(month, 'MMMM yyyy')}</h1>
        <button type="button" className={styles.nav} aria-label={t('calendar.next')} onClick={() => setMonth(addMonths(month, 1))}>
          <Icon name="chevron" />
        </button>
      </header>

      <div className={styles.grid} role="grid" aria-label={format(month, 'MMMM yyyy')}>
        {weekdays.map((w, i) => (
          <div key={i} className={styles.weekday} aria-hidden="true">
            {w}
          </div>
        ))}
        {days.map((d) => {
          const iso = toISO(d)
          const mark = marks.get(iso)
          const state = [mark, iso === today && 'today', !isSameMonth(d, month) && 'outside'].filter(Boolean).join(' ')
          const label = [format(d, 'EEEE d MMMM'), mark && t(`calendar.legend.${mark}`), iso === today && t('calendar.today')]
            .filter(Boolean)
            .join(', ')
          const inner = <span>{format(d, 'd')}</span>
          return iso <= today ? (
            <Link key={iso} to={`/day/${iso}`} className={styles.day} data-state={state} aria-label={label}>
              {inner}
            </Link>
          ) : (
            <div key={iso} className={styles.day} data-state={state} aria-label={label} aria-disabled="true">
              {inner}
            </div>
          )
        })}
      </div>

      <div className={styles.legend}>
        {(['period', 'predicted', 'fertile', 'spotting'] as const).map((m) => (
          <span key={m} className={styles.legendItem}>
            <span className={styles.swatch} data-state={m} />
            {t(`calendar.legend.${m}`)}
          </span>
        ))}
      </div>

      {status && (
        <Card className={styles.countdown}>
          <CompanionImage id={settings.companionId} pose="sitting" size={64} />
          <div>
            {status.daysUntilNextPeriod > 0 ? (
              <>
                <div className={styles.big}>{t('days', { count: status.daysUntilNextPeriod })}</div>
                <div className={styles.label}>{t('calendar.untilNext', { date: format(parseISO(status.nextPeriodStart), 'd MMMM') })}</div>
              </>
            ) : (
              <div>{status.daysUntilNextPeriod === 0 ? t('home.periodToday') : t('home.periodLate', { count: -status.daysUntilNextPeriod })}</div>
            )}
          </div>
        </Card>
      )}

      <p className={styles.hint}>{t('calendar.hint')}</p>
    </div>
  )
}
