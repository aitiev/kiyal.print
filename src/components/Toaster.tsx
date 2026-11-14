import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { dismissToast, useUI, type Toast } from '@/store/ui'

function ToastItem({ toast }: { toast: Toast }) {
  useEffect(() => {
    const h = setTimeout(() => dismissToast(toast.id), toast.duration)
    return () => clearTimeout(h)
  }, [toast.id, toast.duration])
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      role="status"
      className="pointer-events-auto flex min-h-12 w-full max-w-md items-center gap-3 rounded-2xl bg-ink py-2 pl-4 pr-2 text-bg shadow-lift"
    >
      <span className="flex-1 text-sm font-bold">{toast.message}</span>
      {toast.actionLabel && (
        <button
          type="button"
          className="min-h-11 rounded-xl px-3 text-sm font-extrabold text-peach active:scale-95"
          onClick={() => {
            toast.onAction?.()
            dismissToast(toast.id)
          }}
        >
          {toast.actionLabel}
        </button>
      )}
    </motion.div>
  )
}

/** Toast stack above the bottom nav. */
export function Toaster() {
  const toasts = useUI((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
