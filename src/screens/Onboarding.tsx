import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { CompanionImage } from '../components/CompanionImage'
import { Stepper } from '../components/Stepper'
import { parseBackup, restoreBackup } from '../data/backup'
import { storage } from '../data/web'
import { toISO } from '../domain/cycle'
import { useAppData } from '../hooks/appDataContext'
import styles from './Onboarding.module.css'

type Step = 'welcome' | 'lastPeriod' | 'cycleLength' | 'periodLength' | 'homeScreen'

/** True when opened from the home-screen icon rather than in a Safari tab. */
function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

export function Onboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings, saveSettings, reload } = useAppData()
  const fileInput = useRef<HTMLInputElement>(null)
  const [restoreError, setRestoreError] = useState('')

  const steps: Step[] = ['welcome', 'lastPeriod', 'cycleLength', 'periodLength', ...(isStandalone() ? [] : ['homeScreen' as const])]
  const [index, setIndex] = useState(0)
  const [lastPeriodStart, setLastPeriodStart] = useState(settings.lastPeriodStart ?? '')
  const [cycleLen, setCycleLen] = useState(settings.avgCycleLen)
  const [periodLen, setPeriodLen] = useState(settings.avgPeriodLen)
  const [today] = useState(() => toISO(new Date()))

  const step = steps[index]
  const isLast = index === steps.length - 1

  async function finish() {
    await saveSettings({
      ...settings,
      lastPeriodStart: lastPeriodStart || undefined,
      avgCycleLen: cycleLen,
      avgPeriodLen: periodLen,
      onboarded: true,
    })
    navigate('/', { replace: true })
  }

  async function restore(file: File | undefined) {
    if (!file) return
    try {
      await restoreBackup(storage, parseBackup(await file.text()))
      await reload()
      navigate('/', { replace: true })
    } catch (e) {
      setRestoreError((e as Error).message)
    }
  }

  const next = () => (isLast ? void finish() : setIndex(index + 1))

  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        {index > 0 ? (
          <button type="button" className={styles.back} onClick={() => setIndex(index - 1)}>
            {t('onboarding.back')}
          </button>
        ) : (
          <span />
        )}
        <div className={styles.dots} aria-label={t('onboarding.progress', { step: index + 1, total: steps.length })}>
          {steps.map((s, i) => (
            <span key={s} className={i <= index ? styles.dotOn : styles.dot} />
          ))}
        </div>
        <span />
      </div>

      {step === 'welcome' && (
        <section className={styles.body}>
          <CompanionImage id={settings.companionId} pose="sitting" size={200} />
          <h1>{t('onboarding.welcome.title')}</h1>
          <p>{t('onboarding.welcome.text')}</p>
          <p className={styles.small}>{t('disclaimer')}</p>
        </section>
      )}

      {step === 'lastPeriod' && (
        <section className={styles.body}>
          <h1>{t('onboarding.lastPeriod.title')}</h1>
          <p>{t('onboarding.lastPeriod.text')}</p>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('onboarding.lastPeriod.label')}</span>
            <input id="last-period-start" type="date" max={today} value={lastPeriodStart} onChange={(e) => setLastPeriodStart(e.target.value)} />
          </label>
        </section>
      )}

      {step === 'cycleLength' && (
        <section className={styles.body}>
          <h1>{t('onboarding.cycleLength.title')}</h1>
          <p>{t('onboarding.cycleLength.text')}</p>
          <Stepper label={t('onboarding.cycleLength.title')} value={cycleLen} min={15} max={60} onChange={setCycleLen} />
          <p className={styles.small}>{t('onboarding.notSure')}</p>
        </section>
      )}

      {step === 'periodLength' && (
        <section className={styles.body}>
          <h1>{t('onboarding.periodLength.title')}</h1>
          <p>{t('onboarding.periodLength.text')}</p>
          <Stepper label={t('onboarding.periodLength.title')} value={periodLen} min={1} max={14} onChange={setPeriodLen} />
          <p className={styles.small}>{t('onboarding.notSure')}</p>
        </section>
      )}

      {step === 'homeScreen' && (
        <section className={styles.body}>
          <h1>{t('onboarding.homeScreen.title')}</h1>
          <ol className={styles.steps}>
            <li>{t('onboarding.homeScreen.step1')}</li>
            <li>{t('onboarding.homeScreen.step2')}</li>
            <li>{t('onboarding.homeScreen.step3')}</li>
          </ol>
          <p className={styles.small}>{t('onboarding.homeScreen.why')}</p>
        </section>
      )}

      <div className={styles.actions}>
        <Button onClick={next} disabled={step === 'lastPeriod' && !lastPeriodStart}>
          {step === 'welcome' ? t('onboarding.start') : isLast ? t('onboarding.finish') : t('onboarding.next')}
        </Button>
        {step === 'welcome' && (
          <>
            <Button variant="quiet" onClick={() => fileInput.current?.click()}>
              {t('more.restore.choose')}
            </Button>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => void restore(e.target.files?.[0])} />
            {restoreError && (
              <p className={styles.error} role="status">
                {restoreError}
              </p>
            )}
          </>
        )}
        {step === 'lastPeriod' && (
          <Button variant="quiet" onClick={() => { setLastPeriodStart(''); next() }}>
            {t('onboarding.lastPeriod.skip')}
          </Button>
        )}
      </div>
    </div>
  )
}
