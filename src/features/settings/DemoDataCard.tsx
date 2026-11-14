import { useLiveQuery } from 'dexie-react-hooks'
import { Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/Page'
import { Button } from '@/components/Button'
import { Chip } from '@/components/Chip'
import { hasDemoData, removeDemoData, seedDemoData } from '@/db/seed'
import { useT } from '@/hooks/useT'
import { toast } from '@/store/ui'

/** Clearly labelled, removable demo data (rows flagged `demo: true`). */
export function DemoDataCard() {
  const { t, tp } = useT()
  const has = useLiveQuery(() => hasDemoData(), [])
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 pb-1">
        <h2 className="font-extrabold">{t('settings.demoTitle')}</h2>
        <Chip tone="lavender">{t('settings.demoBadge')}</Chip>
      </div>
      <p className="pb-3 text-sm font-semibold text-muted">{t('settings.demoBody')}</p>
      {has ? (
        <Button
          variant="danger"
          block
          disabled={busy}
          data-testid="remove-demo"
          icon={<Trash2 size={18} />}
          onClick={() => run(async () => void toast({ message: tp('settings.demoRemoved', await removeDemoData()) }))}
        >
          {t('settings.demoRemove')}
        </Button>
      ) : (
        <Button
          variant="secondary"
          block
          disabled={busy || has === undefined}
          data-testid="seed-demo"
          icon={<Sparkles size={18} />}
          onClick={() =>
            run(async () => {
              await seedDemoData()
              toast({ message: t('settings.demoAdded') })
            })
          }
        >
          {t('settings.demoAdd')}
        </Button>
      )}
    </Card>
  )
}
