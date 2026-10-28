import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, StatCard } from '../components/Card'
import { CompanionImage } from '../components/CompanionImage'
import { Icon } from '../components/Icon'
import { useCycleStatus } from '../hooks/useCycleStatus'
import { phaseColors } from '../theme/tokens'
import styles from './Home.module.css'

function greetingKey(hour: number) {
  if (hour < 12) return 'greeting.morning'
  if (hour < 18) return 'greeting.afternoon'
  return 'greeting.evening'
}

export function Home() {
  const { t } = useTranslation()
  const { loading, settings, status } = useCycleStatus()
  const [greeting] = useState(() => greetingKey(new Date().getHours()))

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>{t(greeting)}</h1>
        <p className={styles.subtitle}>{t('greeting.subtitle')}</p>
      </header>

      <div className={styles.mascot}>
        <CompanionImage id={settings.companionId} pose="sitting" size={180} />
      </div>

      {!loading && !status && (
        <Card>
          <p className={styles.note}>{t('home.noData')}</p>
        </Card>
      )}

      {status && (
        <>
          <Card className={styles.countdown}>
            <div>
              <div className={styles.label}>
                {status.daysUntilNextPeriod > 0
                  ? t('home.periodStartsIn')
                  : status.daysUntilNextPeriod === 0
                    ? t('home.periodToday')
                    : t('home.periodLate', { count: -status.daysUntilNextPeriod })}
              </div>
              {status.daysUntilNextPeriod > 0 && (
                <div className={styles.big}>{t('days', { count: status.daysUntilNextPeriod })}</div>
              )}
            </div>
            <Icon name="chevron" />
          </Card>
          <div className={styles.stats}>
            <StatCard label={t('home.cycleDay')} value={status.cycleDay} />
            <StatCard label={t('home.phase')} value={t(`phase.${status.phase}`)} accent={phaseColors[status.phase]} />
          </div>
        </>
      )}
    </div>
  )
}
