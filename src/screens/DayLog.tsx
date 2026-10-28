import { format, parseISO } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Card } from '../components/Card'
import { Icon, type IconName } from '../components/Icon'
import { MoodFace } from '../components/MoodFace'
import { storage } from '../data/web'
import { SYMPTOMS, type DayLog as DayLogData, type Flow, type Mood } from '../data/types'
import { toISO } from '../domain/cycle'
import { useAppData } from '../hooks/appDataContext'
import styles from './DayLog.module.css'

const MAX_SLEEP = 16 * 60

/** Steps in half hours from 0 to 16 hours. Going below 30 minutes clears the entry. */
function adjustSleep(current: number | undefined, delta: number): number | undefined {
  const next = Math.min(MAX_SLEEP, Math.max(0, (current ?? 0) + delta))
  return next === 0 ? undefined : next
}

function formatSleep(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const FLOWS: (Flow | 'none')[] = ['none', 'spotting', 'light', 'medium', 'heavy']
const MOODS: Mood[] = [1, 2, 3, 4, 5]

/** Validates the route date; only today and earlier can be logged. */
export function DayLogRoute() {
  const { date } = useParams()
  const [today] = useState(() => toISO(new Date()))
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) return <Navigate to={`/day/${today}`} replace />
  return <DayLog key={date} date={date} isToday={date === today} />
}

function DayLog({ date, isToday }: { date: string; isToday: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { periodDays, setFlow } = useAppData()
  const [log, setLog] = useState<DayLogData>({ date, symptoms: [] })
  const [loaded, setLoaded] = useState(false)
  const noteTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void storage.getDayLog(date).then((saved) => {
      if (cancelled) return
      if (saved) setLog(saved)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [date])

  const flow = periodDays.find((p) => p.date === date)?.flow ?? 'none'

  function update(next: DayLogData, debounce = false) {
    setLog(next)
    window.clearTimeout(noteTimer.current)
    if (debounce) noteTimer.current = window.setTimeout(() => void storage.saveDayLog(next), 400)
    else void storage.saveDayLog(next)
  }

  const toggleSymptom = (s: string) =>
    update({ ...log, symptoms: log.symptoms.includes(s) ? log.symptoms.filter((x) => x !== s) : [...log.symptoms, s] })

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.back} aria-label={t('day.back')} onClick={() => navigate(-1)}>
          <Icon name="back" />
        </button>
        <div className={styles.title}>
          <h1>{isToday ? t('day.today') : format(parseISO(date), 'EEEE')}</h1>
          <div className={styles.date}>{format(parseISO(date), 'EEE, d MMMM')}</div>
        </div>
        <span />
      </header>

      <Card>
        <h2 className={styles.section}>{t('day.flow')}</h2>
        <div className={styles.flows} role="radiogroup" aria-label={t('day.flow')}>
          {FLOWS.map((f, i) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={flow === f}
              className={styles.flow}
              onClick={() => void setFlow(date, f === 'none' ? null : f)}
            >
              <span className={f === 'none' ? styles.dropEmpty : styles.drop} style={{ transform: `scale(${0.7 + i * 0.09})` }}>
                <Icon name="drop" />
              </span>
              <span className={styles.caption}>{t(`flow.${f}`)}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.section}>{t('day.mood')}</h2>
        <div className={styles.moods} role="radiogroup" aria-label={t('day.mood')}>
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={log.mood === m}
              aria-label={t(`mood.${m}`)}
              className={styles.mood}
              onClick={() => update({ ...log, mood: log.mood === m ? undefined : m })}
            >
              <MoodFace mood={m} />
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.section}>{t('day.symptoms')}</h2>
        <div className={styles.chips}>
          {SYMPTOMS.map((s) => (
            <button key={s} type="button" aria-pressed={log.symptoms.includes(s)} className={styles.chip} onClick={() => toggleSymptom(s)}>
              <span className={styles.chipIcon}>
                <Icon name={s as IconName} size={26} />
              </span>
              <span className={styles.caption}>{t(`symptom.${s}`)}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.section}>{t('day.sleep')}</h2>
        <div className={styles.sleep} role="group" aria-label={t('day.sleep')}>
          <button
            type="button"
            className={styles.sleepStep}
            aria-label={t('day.sleepLess')}
            disabled={!log.sleepMinutes}
            onClick={() => update({ ...log, sleepMinutes: adjustSleep(log.sleepMinutes, -30) })}
          >
            −
          </button>
          <output className={styles.sleepValue} aria-live="polite">
            {log.sleepMinutes ? formatSleep(log.sleepMinutes) : t('day.sleepNotLogged')}
          </output>
          <button
            type="button"
            className={styles.sleepStep}
            aria-label={t('day.sleepMore')}
            disabled={log.sleepMinutes === MAX_SLEEP}
            onClick={() => update({ ...log, sleepMinutes: adjustSleep(log.sleepMinutes, 30) })}
          >
            +
          </button>
        </div>
      </Card>

      <Card>
        <label htmlFor="day-note" className={styles.section}>
          {t('day.note')}
        </label>
        <textarea
          id="day-note"
          className={styles.note}
          rows={3}
          placeholder={t('day.notePlaceholder')}
          value={log.note ?? ''}
          disabled={!loaded}
          onChange={(e) => update({ ...log, note: e.target.value || undefined }, true)}
        />
      </Card>

      <p className={styles.saved}>{t('day.autosave')}</p>
    </div>
  )
}
