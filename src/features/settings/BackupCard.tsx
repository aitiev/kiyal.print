import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Card } from '@/components/Page'
import { Button } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { cn } from '@/lib/cn'
import { db } from '@/db/schema'
import { settingsRepo } from '@/db/repositories/settings'
import { backupFileName, exportBackup, restoreBackup, serializeBackup, validateBackup, type BackupError, type BackupFile, type RestoreMode } from '@/db/backup'
import { loadPrefsFromDb } from '@/db/prefsSync'
import { LOCALE } from '@/lib/i18n'
import { useT } from '@/hooks/useT'
import { confirmDialog, toast } from '@/store/ui'
import { saveTextFile } from './backupFile'

const formatStamp = (ms: number, locale: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(ms)

export function BackupCard() {
  const { t, lang } = useT()
  const lastBackupAt = useLiveQuery(() => settingsRepo.get<number>('lastBackupAt'), [])
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<BackupFile | null>(null)

  const errorText = (e: BackupError) => {
    switch (e.code) {
      case 'not_json':
        return t('backup.error.notJson')
      case 'not_backup':
        return t('backup.error.notBackup')
      case 'newer_version':
        return t('backup.error.newer')
      case 'invalid_row':
        return t('backup.error.invalidRow', { table: t(`backup.table.${e.table}`), index: e.index + 1, field: e.field })
    }
  }

  const doExport = async () => {
    setBusy(true)
    try {
      const now = Date.now()
      const file = await exportBackup(db, now)
      const outcome = await saveTextFile(serializeBackup(file), backupFileName(now), t('backup.shareTitle'))
      if (outcome === 'cancelled') return
      await settingsRepo.set('lastBackupAt', now)
      toast({ message: t(outcome === 'shared' ? 'backup.shared' : 'backup.downloaded') })
    } catch (e) {
      console.warn('backup: export failed', e)
      toast({ message: t('backup.error.export') })
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (f: File | undefined) => {
    if (input.current) input.current.value = ''
    if (!f) return
    const r = validateBackup(await f.text())
    if (!r.ok) return toast({ message: errorText(r.error), duration: 6000 })
    setPending(r.file)
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="font-extrabold">{t('backup.title')}</h2>
        <p className="pt-1 text-sm font-semibold text-muted">{t('backup.body')}</p>
      </div>
      <p className="text-sm font-bold" data-testid="last-backup">
        {lastBackupAt ? t('backup.last', { date: formatStamp(lastBackupAt, LOCALE[lang]) }) : t('backup.never')}
      </p>
      <div className="grid gap-2">
        <Button icon={<Download size={18} />} onClick={doExport} disabled={busy} data-testid="backup-export">
          {t('backup.export')}
        </Button>
        <Button variant="secondary" icon={<Upload size={18} />} onClick={() => input.current?.click()} disabled={busy}>
          {t('backup.import')}
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        data-testid="backup-input"
        aria-label={t('backup.import')}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <RestoreSheet file={pending} onClose={() => setPending(null)} />
    </Card>
  )
}

function RestoreSheet({ file, onClose }: { file: BackupFile | null; onClose: () => void }) {
  const { t, tp, lang } = useT()
  const [mode, setMode] = useState<RestoreMode>('merge')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!file) return
    if (mode === 'replace') {
      const [o, e, a] = await Promise.all([db.orders.count(), db.expenses.count(), db.ads.count()])
      const ok = await confirmDialog({
        title: t('backup.replaceConfirmTitle'),
        body: t('backup.replaceConfirmBody', { orders: o, expenses: e, ads: a }),
        confirmLabel: t('backup.replaceConfirm'),
        danger: true,
      })
      if (!ok) return
    }
    setBusy(true)
    try {
      const report = await restoreBackup(file, mode)
      await loadPrefsFromDb()
      const tables = ['orders', 'expenses', 'ads', 'goals'] as const
      const added = tables.reduce((n, k) => n + report[k].added, 0)
      const updated = tables.reduce((n, k) => n + report[k].updated, 0)
      toast({ message: t('backup.restored', { added, updated }), duration: 5000 })
      onClose()
    } catch (e) {
      console.warn('backup: restore failed', e)
      toast({ message: t('backup.error.restore') })
    } finally {
      setBusy(false)
    }
  }

  const options: { value: RestoreMode; title: string; body: string }[] = [
    { value: 'merge', title: t('backup.merge'), body: t('backup.mergeBody') },
    { value: 'replace', title: t('backup.replace'), body: t('backup.replaceBody') },
  ]

  return (
    <Sheet
      open={!!file}
      onClose={onClose}
      title={t('backup.restoreTitle')}
      size="sm"
      footer={
        <Button block onClick={run} disabled={busy} variant={mode === 'replace' ? 'danger' : 'primary'}>
          {t('backup.restore')}
        </Button>
      }
    >
      {file && (
        <div className="flex flex-col gap-4 pb-2">
          <div className="rounded-2xl bg-surface-2 p-3 text-sm font-semibold">
            {file.exportedAt > 0 && <p className="pb-1 font-extrabold">{t('backup.fileFrom', { date: formatStamp(file.exportedAt, LOCALE[lang]) })}</p>}
            <p className="text-muted" data-testid="restore-counts">
              {[tp('orders.count', file.data.orders.length), tp('backup.expensesCount', file.data.expenses.length), tp('backup.adsCount', file.data.ads.length)].join(' · ')}
            </p>
          </div>
          <div role="radiogroup" aria-label={t('backup.modeLabel')} className="flex flex-col gap-2">
            {options.map((o) => {
              const active = mode === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(o.value)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl p-3 text-left ring-2 transition-colors',
                    active ? (o.value === 'replace' ? 'bg-danger-soft ring-danger' : 'bg-mint-soft ring-mint') : 'bg-surface ring-line',
                  )}
                >
                  <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-2', active ? 'ring-current' : 'ring-line')}>
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-current" />}
                  </span>
                  <span>
                    <span className="block font-extrabold text-ink">{o.title}</span>
                    <span className="block text-sm font-semibold text-muted">{o.body}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Sheet>
  )
}
