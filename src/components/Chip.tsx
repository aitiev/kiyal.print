import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { toneSoft, type Tone } from './tone'

interface ChipProps {
  children: ReactNode
  tone?: Tone
  icon?: ReactNode
  /** When set, renders a 44px-tall toggle button. */
  onClick?: () => void
  selected?: boolean
  className?: string
  ariaLabel?: string
}

/** Pastel pill. Static badge by default; becomes a toggle button with `onClick`. */
export function Chip({ children, tone = 'neutral', icon, onClick, selected, className, ariaLabel }: ChipProps) {
  const base = 'inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap'
  if (!onClick) {
    return <span className={cn(base, 'px-2.5 py-1 text-xs', toneSoft[tone], className)}>{icon}{children}</span>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={cn(
        base,
        'min-h-11 px-4 text-sm transition-colors active:scale-[0.97]',
        selected ? toneSoft[tone === 'neutral' ? 'lavender' : tone] + ' ring-2 ring-current/30' : 'bg-surface text-ink ring-1 ring-line',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}
