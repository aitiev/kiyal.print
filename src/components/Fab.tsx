import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'

/** Floating "+" button: above the bottom bar on phones, bottom-right on wide screens. */
export function Fab({ label, onClick, visible = true }: { label: string; onClick: () => void; visible?: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label={label}
          title={label}
          onClick={onClick}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 45 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="fixed bottom-[calc(5.75rem+max(0.75rem,env(safe-area-inset-bottom)))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 grid h-16 w-16 place-items-center rounded-full bg-peach text-on-accent shadow-lift md:bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:right-[max(2rem,env(safe-area-inset-right))]"
        >
          <Plus size={30} strokeWidth={3} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
