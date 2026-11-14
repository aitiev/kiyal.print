import { motion } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/lib/cn'

interface Option<T extends string> {
  value: T
  label: string
}
interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
  ariaLabel?: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, className, ariaLabel }: Props<T>) {
  const id = useId()
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex rounded-2xl bg-surface-2 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn('relative min-h-11 flex-1 rounded-xl px-3 text-sm font-bold transition-colors', active ? 'text-ink' : 'text-muted')}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-surface shadow-soft"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
