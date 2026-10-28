import { format, parseISO } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/Card'
import { CompanionImage } from '../components/CompanionImage'
import { CycleRing } from '../components/CycleRing'
import { Icon, type IconName } from '../components/Icon'
import { MoodFace } from '../components/MoodFace'
import { SegmentedControl } from '../components/SegmentedControl'
import { storage } from '../data/web'
import { SYMPTOMS, type DayLog, type Mood } from '../data/types'
import { phaseRanges, toISO } from '../domain/cycle'
import { MIN_DAYS, PHASES, cycleHistory, findPatterns, moodByPhase, phaseLookup, symptomsByPhase, type Pattern } from '../domain/insights'
import { useAppData } from '../hooks/appDataContext'
import { useCycleStatus } from '../hooks/useCycleStatus'
import { phaseColors } from '../theme/tokens'
import styles from './Insights.module.css'

type View = 'cycle' | 'mood' | 'symptoms'

export function Insights() {
  const { t } = useTranslation()
  const { periodDays } = useAppData()
  const { settings, status } = useCycleStatus()
  const [view, setView] = useState<View>('cycle')
  const [logs, setLogs] = useState<DayLog[]>([])
  const [today] = useState(() => toISO(new Date()))

  useEffect(() => {
    let cancelled = false
    void storage.listDayLogs().then((l) => {
      if (!cancelled) setLogs(l)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const data = useMemo(() => {
    const history = cycleHistory(periodDays, settings, today)
    const phaseOf = phaseLookup(history, periodDays, settings, today)
    const moods = moodByPhase(logs, phaseOf)
    const counts = symptomsByPhase(logs, phaseOf)
    const complete = history.filter((c) => c.length !== null)
    return { history, moods, counts, complete, patterns: findPatterns(counts, moods, complete.length) }
  }, [periodDays, settings, logs, today])

  const phaseName = (p: string) => t(`phase.${p}`)
  const patternText = (p: Pattern) =>
    p.kind === 'symptom'
      ? t(`insights.patterns.symptoms.${p.key}`, { phase: phaseName(p.phase).toLowerCase() })
      : t('insights.patterns.lowMood', { phase: phaseName(p.phase).toLowerCase() })

  return (
    <div className={styles.screen}>
      <h1>{t('tabs.insights')}</h1>
      <SegmentedControl<View>
        label={t('tabs.insights')}
        value={view}
        onChange={setView}
        options={[
          { value: 'cycle', label: t('insights.tabs.cycle') },
          { value: 'mood', label: t('insights.tabs.mood') },
          { value: 'symptoms', label: t('insights.tabs.symptoms') },
        ]}
      />

      {view === 'cycle' &&
        (status ? (
          <>
            <Card className={styles.stack}>
              <CycleRing
                cycleLen={status.cycleLen}
                periodLen={status.periodLen}
                cycleDay={status.cycleDay}
                label={t('insights.ringLabel', { day: status.cycleDay, length: status.cycleLen, phase: phaseName(status.phase).toLowerCase() })}
              >
                <CompanionImage id={settings.companionId} pose="sitting" size={72} />
                <div className={styles.ringDay}>{t('insights.day', { day: status.cycleDay })}</div>
                <div className={styles.muted}>{t('insights.phaseOf', { phase: phaseName(status.phase) })}</div>
              </CycleRing>
              <ul className={styles.list}>
                {phaseRanges(status.cycleLen, status.periodLen).map((r) => (
                  <li key={r.phase} className={styles.row}>
                    <span className={styles.dot} style={{ background: phaseColors[r.phase] }} />
                    <span className={styles.grow}>{phaseName(r.phase)}</span>
                    <span className={styles.muted}>{r.from === r.to ? r.from : `${r.from}–${r.to}`}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className={styles.stats}>
              <Card>
                <div className={styles.muted}>{t('insights.cycleLength')}</div>
                <div className={styles.number}>{t('days', { count: status.cycleLen })}</div>
                <div className={styles.small}>
                  {data.complete.length ? t('insights.averageOf', { count: Math.min(data.complete.length, 6) }) : t('insights.fromSettings')}
                </div>
              </Card>
              <Card>
                <div className={styles.muted}>{t('insights.periodLength')}</div>
                <div className={styles.number}>{t('days', { count: status.periodLen })}</div>
                <div className={styles.small}>
                  {data.history.some((c) => c.periodLength) ? t('insights.fromLogged') : t('insights.fromSettings')}
                </div>
              </Card>
            </div>

            <Card className={styles.next}>
              <div>
                <div className={styles.muted}>{t('insights.nextPeriod')}</div>
                <div className={styles.number}>
                  {status.daysUntilNextPeriod > 0
                    ? t('insights.inDays', { count: status.daysUntilNextPeriod })
                    : status.daysUntilNextPeriod === 0
                      ? t('insights.today')
                      : t('insights.late', { count: -status.daysUntilNextPeriod })}
                </div>
                <div className={styles.small}>{format(parseISO(status.nextPeriodStart), 'EEEE d MMMM')}</div>
              </div>
              <CompanionImage id={settings.companionId} pose="sitting" size={72} />
            </Card>

            <Card>
              <h2 className={styles.h2}>{t('insights.history')}</h2>
              <ul className={styles.list}>
                {[...data.history].reverse().slice(0, 6).map((c) => (
                  <li key={c.start} className={styles.row}>
                    <span className={styles.grow}>{format(parseISO(c.start), 'd MMM yyyy')}</span>
                    <span className={styles.muted}>
                      {c.periodLength ? t('insights.periodDays', { count: c.periodLength }) : '–'}
                    </span>
                    <span className={styles.length}>{c.length ? t('days', { count: c.length }) : t('insights.ongoing')}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        ) : (
          <Card>
            <p className={styles.empty}>{t('home.noData')}</p>
          </Card>
        ))}

      {view === 'mood' && (
        <Card>
          <h2 className={styles.h2}>{t('insights.moodTitle')}</h2>
          <ul className={styles.list}>
            {PHASES.map((p) => {
              const m = data.moods[p]
              return (
                <li key={p} className={styles.row}>
                  <span className={styles.dot} style={{ background: phaseColors[p] }} />
                  <span className={styles.grow}>{phaseName(p)}</span>
                  {m && m.count >= MIN_DAYS ? (
                    <>
                      <span className={styles.muted}>{t('insights.entries', { count: m.count })}</span>
                      <span aria-label={t(`mood.${Math.round(m.average)}`)} role="img">
                        <MoodFace mood={Math.round(m.average) as Mood} size={36} />
                      </span>
                    </>
                  ) : (
                    <span className={styles.small}>{t('insights.notEnough')}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {view === 'symptoms' && (
        <Card>
          <h2 className={styles.h2}>{t('insights.symptomsTitle')}</h2>
          {SYMPTOMS.some((s) => data.counts.bySymptom[s]) ? (
            <ul className={styles.symptoms}>
              {SYMPTOMS.filter((s) => data.counts.bySymptom[s]).map((s) => (
                <li key={s}>
                  <div className={styles.symptomHead}>
                    <Icon name={s as IconName} size={22} />
                    <span>{t(`symptom.${s}`)}</span>
                  </div>
                  {PHASES.filter((p) => data.counts.logged[p] > 0).map((p) => (
                    <div key={p} className={styles.row}>
                      <span className={styles.dot} style={{ background: phaseColors[p] }} />
                      <span className={styles.grow}>{phaseName(p)}</span>
                      <span className={styles.muted}>
                        {t('insights.ofDays', { days: data.counts.bySymptom[s][p], count: data.counts.logged[p] })}
                      </span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>{t('insights.noSymptoms')}</p>
          )}
        </Card>
      )}

      <Card>
        <h2 className={styles.h2}>{t('insights.patterns.title')}</h2>
        {data.patterns.length ? (
          <ul className={styles.patterns}>
            {data.patterns.map((p) => (
              <li key={`${p.kind}-${p.key}-${p.phase}`}>{patternText(p)}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{t('insights.patterns.empty')}</p>
        )}
        <p className={styles.small}>{t('insights.patterns.note')}</p>
      </Card>
    </div>
  )
}
