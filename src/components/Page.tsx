import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

/** Screen wrapper: large title header + content column that widens on iPad. */
export function Page({ title, subtitle, actions, children }: PageProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto w-full max-w-5xl px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pb-16"
    >
      <header className="flex items-end justify-between gap-3 pb-4 pt-3">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="pt-0.5 text-sm font-semibold text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </header>
      {children}
    </motion.main>
  )
}

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string; 'data-testid'?: string }) {
  return (
    <section className={`rounded-card bg-surface p-4 shadow-soft ${className}`} {...rest}>
      {children}
    </section>
  )
}
