import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  emoji?: string
  title: string
  body?: string
  action?: ReactNode
}

export function EmptyState({ emoji = '🖍️', title, body, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-12 text-center"
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-peach-soft text-5xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {body && <p className="text-sm font-semibold text-muted">{body}</p>}
      {action}
    </motion.div>
  )
}
