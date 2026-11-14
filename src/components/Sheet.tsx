import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useIsWide } from '@/hooks/useMedia'
import { useUI } from '@/store/ui'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/cn'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Sticky footer (e.g. Save button). */
  footer?: ReactNode
  /** Smaller max width for dialogs. */
  size?: 'md' | 'sm'
}

/**
 * Bottom sheet on phones (drag the handle down to close), centred dialog on iPad/desktop.
 * Locks body scroll, closes on Escape and backdrop tap, and focuses the panel when it opens.
 */
export function Sheet({ open, onClose, title, children, footer, size = 'md' }: SheetProps) {
  const wide = useIsWide()
  const { t } = useT()
  const drag = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // preventScroll: focusing while the panel slides in would scroll the overlay and misplace it.
    const raf = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }))
    useUI.setState((s) => ({ sheetDepth: s.sheetDepth + 1 }))
    return () => {
      useUI.setState((s) => ({ sheetDepth: Math.max(0, s.sheetDepth - 1) }))
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
    }
  }, [open, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-(--overlay) backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col bg-bg shadow-lift outline-none',
              wide ? 'rounded-[2rem]' : 'rounded-t-[2rem]',
              wide && (size === 'sm' ? 'max-w-md' : 'max-w-xl'),
            )}
            initial={wide ? { opacity: 0, scale: 0.95, y: 12 } : { y: '100%' }}
            animate={wide ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={wide ? { opacity: 0, scale: 0.95, y: 12 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            drag={wide ? false : 'y'}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div
              className="flex shrink-0 touch-none flex-col items-center pt-2"
              onPointerDown={(e) => !wide && drag.start(e)}
            >
              {!wide && <span className="h-1.5 w-10 rounded-full bg-line" aria-hidden />}
              <div className="flex w-full items-center justify-between gap-3 px-5 pb-2 pt-2">
                <h2 className="text-xl font-extrabold">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('common.close')}
                  className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-muted active:scale-95"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
            {footer && <div className="shrink-0 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
            {!footer && <div className="pb-safe" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
