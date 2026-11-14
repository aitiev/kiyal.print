import { motion } from 'framer-motion'
import { Home, ReceiptText, Settings, ShoppingBag, type LucideIcon } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/cn'
import { useUI, type Tab } from '@/store/ui'

const NAV: { tab: Tab; icon: LucideIcon }[] = [
  { tab: 'dashboard', icon: Home },
  { tab: 'orders', icon: ShoppingBag },
  { tab: 'expenses', icon: ReceiptText },
  { tab: 'settings', icon: Settings },
]

/** Phone: floating bottom tab bar. iPad/desktop (md+): left side rail. */
export function BottomNav() {
  const { t } = useT()
  const tab = useUI((s) => s.tab)
  const setTab = useUI((s) => s.setTab)

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed z-40 bg-surface/90 shadow-lift backdrop-blur-xl',
        // phone
        'inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] rounded-[1.75rem]',
        // rail
        'md:inset-x-auto md:bottom-4 md:left-[max(1rem,env(safe-area-inset-left))] md:top-[max(1rem,env(safe-area-inset-top))] md:w-24 md:rounded-[2rem]',
      )}
    >
      <img
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt=""
        aria-hidden
        className="mx-auto mt-5 hidden h-14 w-14 rounded-2xl md:block"
      />
      <ul className="flex h-[4.25rem] items-stretch justify-around px-1 md:h-auto md:flex-col md:justify-start md:gap-2 md:px-2 md:pt-6">
        {NAV.map(({ tab: id, icon: Icon }) => {
          const active = id === tab
          return (
            <li key={id} className="flex flex-1 md:flex-none">
              <button
                type="button"
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl text-[11px] font-bold transition-colors md:py-3',
                  active ? 'text-peach' : 'text-muted',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-1 rounded-[1.25rem] bg-peach-soft"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className="relative" size={24} strokeWidth={active ? 2.6 : 2.2} />
                <span className="relative">{t(`tabs.${id}`)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
