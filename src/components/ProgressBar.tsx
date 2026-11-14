import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import type { Tone } from './tone'

const fill: Record<Tone, string> = {
  peach: 'bg-peach',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  sun: 'bg-sun',
  danger: 'bg-danger',
  neutral: 'bg-ink',
}

/** value 0..1 */
export function ProgressBar({ value, tone = 'mint', className, label }: { value: number; tone?: Tone; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-3 overflow-hidden rounded-full bg-surface-2', className)}
    >
      <motion.div
        className={cn('h-full rounded-full', fill[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  )
}
