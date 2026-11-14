import { motion, useAnimationControls } from 'framer-motion'
import { Delete } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { PIN_LENGTH } from '@/lib/pin'
import { cn } from '@/lib/cn'
import { useT } from '@/hooks/useT'

interface Props {
  value: string
  onChange: (v: string) => void
  /** Called once when PIN_LENGTH digits are entered. */
  onComplete: (pin: string) => void
  disabled?: boolean
  /** Increment to play the "wrong PIN" shake. */
  shake?: number
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

/** Dots + numeric keypad. Also accepts the hardware keyboard (digits, Backspace). */
export function PinPad({ value, onChange, onComplete, disabled, shake = 0 }: Props) {
  const { t } = useT()
  const controls = useAnimationControls()
  const latest = useRef({ value, onChange, onComplete, disabled })
  useEffect(() => {
    latest.current = { value, onChange, onComplete, disabled }
  })

  useEffect(() => {
    if (shake > 0) void controls.start({ x: [0, -12, 12, -8, 8, -4, 0], transition: { duration: 0.4 } })
  }, [shake, controls])

  const press = (k: string) => {
    const { value: v, onChange: change, onComplete: complete, disabled: off } = latest.current
    if (off) return
    if (k === 'del') return change(v.slice(0, -1))
    if (v.length >= PIN_LENGTH) return
    const next = v + k
    change(next)
    if (next.length === PIN_LENGTH) complete(next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('del')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex flex-col items-center gap-8">
      <motion.div animate={controls} className="flex gap-4" role="status" aria-label={t('pin.entered', { n: value.length, total: PIN_LENGTH })}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={cn('h-4 w-4 rounded-full transition-colors', i < value.length ? 'bg-peach' : 'bg-surface-2 ring-2 ring-line')}
          />
        ))}
      </motion.div>
      <div className="grid grid-cols-3 gap-4">
        {KEYS.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => press(k)}
              aria-label={k === 'del' ? t('pin.delete') : k}
              data-pin-key={k}
              className={cn(
                'grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full text-2xl font-extrabold transition active:scale-95 disabled:opacity-40',
                k === 'del' ? 'text-muted' : 'bg-surface shadow-soft',
              )}
            >
              {k === 'del' ? <Delete size={26} /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
