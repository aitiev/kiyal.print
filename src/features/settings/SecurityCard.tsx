import { Lock, LockOpen } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/Page'
import { Button } from '@/components/Button'
import { SegmentedControl } from '@/components/SegmentedControl'
import { LOCK_TIMEOUTS, lockNow, setLockTimeout, useLock, type LockTimeout } from '@/store/lock'
import { useT } from '@/hooks/useT'
import { PinSheet, type PinFlow } from '@/features/lock/PinSheet'

export function SecurityCard() {
  const { t } = useT()
  const hasPin = useLock((s) => s.hasPin)
  const timeoutMin = useLock((s) => s.timeoutMin)
  const [flow, setFlow] = useState<PinFlow | null>(null)

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="font-extrabold">{t('pin.title')}</h2>
        <p className="pt-1 text-sm font-semibold text-muted">{hasPin ? t('pin.onBody') : t('pin.offBody')}</p>
      </div>
      {hasPin ? (
        <>
          <div>
            <p className="pb-2 text-sm font-bold">{t('pin.timeout')}</p>
            <SegmentedControl<`${LockTimeout}`>
              ariaLabel={t('pin.timeout')}
              value={`${timeoutMin}`}
              onChange={(v) => void setLockTimeout(Number(v) as LockTimeout)}
              options={LOCK_TIMEOUTS.map((m) => ({ value: `${m}` as const, label: m === 0 ? t('pin.immediately') : t('pin.minutes', { n: m }) }))}
            />
          </div>
          <div className="grid gap-2">
            <Button variant="secondary" onClick={() => setFlow('change')}>
              {t('pin.change')}
            </Button>
            <Button variant="secondary" icon={<Lock size={18} />} onClick={lockNow}>
              {t('pin.lockNow')}
            </Button>
          </div>
          <Button variant="danger" icon={<LockOpen size={18} />} onClick={() => setFlow('disable')}>
            {t('pin.disable')}
          </Button>
        </>
      ) : (
        <Button variant="secondary" icon={<Lock size={18} />} onClick={() => setFlow('set')}>
          {t('pin.set')}
        </Button>
      )}
      <p className="text-xs font-semibold text-muted">{t('pin.note')}</p>
      <PinSheet flow={flow} onClose={() => setFlow(null)} />
    </Card>
  )
}
