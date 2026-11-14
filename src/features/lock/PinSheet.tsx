import { useState } from 'react'
import { Sheet } from '@/components/Sheet'
import { checkPin, disablePin, setPin } from '@/store/lock'
import { toast } from '@/store/ui'
import type { MsgKey } from '@/lib/i18n'
import { useT } from '@/hooks/useT'
import { PinPad } from './PinPad'

export type PinFlow = 'set' | 'change' | 'disable'
type Step = 'current' | 'new' | 'confirm'

const TITLE: Record<PinFlow, MsgKey> = { set: 'pin.setTitle', change: 'pin.changeTitle', disable: 'pin.disableTitle' }
const PROMPT: Record<Step, MsgKey> = { current: 'pin.enterCurrent', new: 'pin.enterNew', confirm: 'pin.confirmNew' }

/** Set / change / disable the PIN: current → new → confirm, as needed. */
export function PinSheet({ flow, onClose }: { flow: PinFlow | null; onClose: () => void }) {
  const { t } = useT()
  return (
    <Sheet open={!!flow} onClose={onClose} title={flow ? t(TITLE[flow]) : ''} size="sm">
      {flow && <PinFlowBody key={flow} flow={flow} onDone={onClose} />}
    </Sheet>
  )
}

function PinFlowBody({ flow, onDone }: { flow: PinFlow; onDone: () => void }) {
  const { t } = useT()
  const [step, setStep] = useState<Step>(flow === 'set' ? 'new' : 'current')
  const [value, setValue] = useState('')
  const [first, setFirst] = useState('')
  const [error, setError] = useState<MsgKey>()
  const [shake, setShake] = useState(0)
  const [busy, setBusy] = useState(false)

  const fail = (msg: MsgKey) => {
    setError(msg)
    setValue('')
    setShake((n) => n + 1)
  }

  const complete = async (pin: string) => {
    setBusy(true)
    try {
      if (step === 'current') {
        if (!(await checkPin(pin))) return fail('pin.wrong')
        if (flow === 'disable') {
          await disablePin()
          toast({ message: t('pin.disabled') })
          return onDone()
        }
        setStep('new')
      } else if (step === 'new') {
        setFirst(pin)
        setStep('confirm')
      } else {
        if (pin !== first) {
          setStep('new')
          setFirst('')
          return fail('pin.mismatch')
        }
        await setPin(pin)
        toast({ message: t(flow === 'set' ? 'pin.enabled' : 'pin.changed') })
        return onDone()
      }
      setError(undefined)
      setValue('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 pb-4 pt-1">
      <div className="text-center">
        <p className="font-extrabold">{t(PROMPT[step])}</p>
        <p className="min-h-5 pt-1 text-sm font-semibold text-danger" aria-live="polite">
          {error ? t(error) : ''}
        </p>
      </div>
      <PinPad value={value} onChange={setValue} onComplete={complete} disabled={busy} shake={shake} />
    </div>
  )
}
