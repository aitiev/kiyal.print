import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { unlock, useLock } from '@/store/lock'
import { useT } from '@/hooks/useT'
import { PinPad } from './PinPad'

/** Full-screen PIN prompt. Everything else in <body> is made inert while it is shown. */
export function LockScreen() {
  const { t } = useT()
  const fails = useLock((s) => s.fails)
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const wait = Math.max(0, Math.ceil((fails.until - now) / 1000))

  useEffect(() => {
    const others = [...document.body.children].filter((el) => el.id !== 'lock-root') as HTMLElement[]
    others.forEach((el) => (el.inert = true))
    return () => others.forEach((el) => (el.inert = false))
  }, [])

  useEffect(() => {
    if (fails.until <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [fails.until])

  const submit = async (pin: string) => {
    const r = await unlock(pin)
    if (r.ok) return
    setValue('')
    setNow(Date.now())
    setShake((n) => n + 1)
  }

  return createPortal(
    <motion.div
      id="lock-screen"
      role="dialog"
      aria-modal
      aria-label={t('pin.lockTitle')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 overflow-y-auto bg-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]"
    >
      <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className="h-16 w-16 rounded-2xl shadow-soft" />
      <div className="text-center">
        <h1 className="text-2xl font-black">{t('pin.lockTitle')}</h1>
        <p className="min-h-5 pt-1 text-sm font-semibold text-muted" aria-live="polite">
          {wait > 0 ? t('pin.wait', { s: wait }) : fails.count > 0 ? t('pin.wrong') : t('pin.lockBody')}
        </p>
      </div>
      <PinPad value={value} onChange={setValue} onComplete={submit} disabled={wait > 0} shake={shake} />
      <p className="max-w-xs text-center text-xs font-semibold text-muted">{t('pin.forgot')}</p>
    </motion.div>,
    document.getElementById('lock-root') ?? document.body,
  )
}
