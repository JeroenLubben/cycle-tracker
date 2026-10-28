import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Stepper } from '../components/Stepper'
import { backupFileName, createBackup, parseBackup, restoreBackup, type Backup } from '../data/backup'
import { storage } from '../data/web'
import { saveFile } from '../data/web/saveFile'
import { toISO } from '../domain/cycle'
import { useAppData } from '../hooks/appDataContext'
import styles from './More.module.css'

type Pending = { kind: 'restore'; backup: Backup } | { kind: 'delete' } | null

export function More() {
  const { t } = useTranslation()
  const { settings, saveSettings, reload } = useAppData()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [today] = useState(() => new Date())

  const lastBackup = settings.lastBackupAt
    ? (() => {
        const days = differenceInCalendarDays(today, parseISO(settings.lastBackupAt))
        return days === 0 ? t('more.backup.today') : days === 1 ? t('more.backup.yesterday') : t('more.backup.daysAgo', { count: days })
      })()
    : t('more.backup.never')

  async function exportBackup() {
    setBusy(true)
    setMessage(null)
    try {
      const backup = await createBackup(storage)
      const result = await saveFile(JSON.stringify(backup, null, 2), backupFileName(toISO(today)))
      if (result !== 'cancelled') {
        await saveSettings({ ...settings, lastBackupAt: new Date().toISOString() })
        setMessage({ text: t('more.backup.saved') })
      }
    } catch {
      setMessage({ text: t('more.backup.saveFailed'), error: true })
    } finally {
      setBusy(false)
    }
  }

  async function chooseFile(file: File | undefined) {
    if (!file) return
    setMessage(null)
    try {
      setPending({ kind: 'restore', backup: parseBackup(await file.text()) })
    } catch (e) {
      setMessage({ text: (e as Error).message, error: true })
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function confirm() {
    if (!pending) return
    setBusy(true)
    if (pending.kind === 'restore') {
      await restoreBackup(storage, pending.backup)
      setMessage({ text: t('more.restore.done') })
    } else {
      await storage.clearAll()
    }
    setPending(null)
    setBusy(false)
    await reload()
  }

  const confirmPanel = (kind: 'restore' | 'delete') =>
    pending?.kind === kind && (
      <div className={styles.confirm} ref={(el) => el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })}>
        {pending.kind === 'restore' ? (
          <>
            <h3>{t('more.restore.confirmTitle', { date: pending.backup.exportedAt ? format(parseISO(pending.backup.exportedAt), 'd MMMM yyyy') : '?' })}</h3>
            <p>
              {t('more.restore.confirmText', {
                periods: t('more.restore.periodDays', { count: pending.backup.periodDays.length }),
                logs: t('more.restore.dayLogs', { count: pending.backup.dayLogs.length }),
              })}
            </p>
          </>
        ) : (
          <>
            <h3>{t('more.delete.confirmTitle')}</h3>
            <p>{t('more.delete.confirmText')}</p>
          </>
        )}
        <Button onClick={() => void confirm()} disabled={busy}>
          {pending.kind === 'restore' ? t('more.restore.confirm') : t('more.delete.confirm')}
        </Button>
        <Button variant="quiet" onClick={() => setPending(null)} disabled={busy}>
          {t('more.cancel')}
        </Button>
      </div>
    )

  return (
    <div className={styles.screen}>
      <h1>{t('tabs.more')}</h1>

      <Card className={styles.section}>
        <h2>{t('more.backup.title')}</h2>
        <p>{t('more.backup.text')}</p>
        <p className={styles.meta}>{t('more.backup.last', { when: lastBackup })}</p>
        <Button onClick={() => void exportBackup()} disabled={busy}>
          {t('more.backup.save')}
        </Button>
        <Button variant="quiet" onClick={() => fileInput.current?.click()} disabled={busy}>
          {t('more.restore.choose')}
        </Button>
        <input
          ref={fileInput}
          id="restore-file"
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => void chooseFile(e.target.files?.[0])}
        />
        {confirmPanel('restore')}
        {message && (
          <p className={message.error ? styles.error : styles.success} role="status">
            {message.text}
          </p>
        )}
      </Card>

      <Card className={styles.section}>
        <h2>{t('more.cycle.title')}</h2>
        <p>{t('more.cycle.text')}</p>
        <div className={styles.label}>{t('more.cycle.cycleLength')}</div>
        <Stepper label={t('more.cycle.cycleLength')} value={settings.avgCycleLen} min={15} max={60} onChange={(v) => void saveSettings({ ...settings, avgCycleLen: v })} />
        <div className={styles.label}>{t('more.cycle.periodLength')}</div>
        <Stepper label={t('more.cycle.periodLength')} value={settings.avgPeriodLen} min={1} max={14} onChange={(v) => void saveSettings({ ...settings, avgPeriodLen: v })} />
      </Card>

      <Card className={styles.section}>
        <h2>{t('more.delete.title')}</h2>
        <p>{t('more.delete.text')}</p>
        <Button variant="quiet" onClick={() => setPending({ kind: 'delete' })} disabled={busy}>
          {t('more.delete.button')}
        </Button>
        {confirmPanel('delete')}
      </Card>

      <p className={styles.about}>{t('disclaimer')}</p>
    </div>
  )
}
