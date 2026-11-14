import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { toneSoft, type Tone } from './tone'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: Tone
  className?: string
  onClick?: () => void
}

export function StatCard({ label, value, hint, icon, tone = 'peach', className, onClick }: StatCardProps) {
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn('flex flex-col gap-2 rounded-card bg-surface p-4 text-left shadow-soft', className)}
    >
      <div className="flex items-center gap-2">
        {icon && <span className={cn('grid h-9 w-9 place-items-center rounded-xl', toneSoft[tone])}>{icon}</span>}
        <span className="text-sm font-semibold text-muted">{label}</span>
      </div>
      <div className="tabular text-2xl font-extrabold leading-tight">{value}</div>
      {hint && <div className="text-xs font-semibold text-muted">{hint}</div>}
    </Comp>
  )
}
