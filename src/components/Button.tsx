import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  block?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-peach text-on-accent shadow-soft active:brightness-95',
  secondary: 'bg-surface-2 text-ink active:brightness-95',
  ghost: 'bg-transparent text-ink active:bg-surface-2',
  danger: 'bg-danger-soft text-danger active:brightness-95',
}
const sizes: Record<Size, string> = {
  md: 'h-12 px-5 text-base gap-2 rounded-2xl',
  sm: 'h-11 px-4 text-sm gap-1.5 rounded-xl',
  icon: 'h-11 w-11 rounded-full',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, block, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center font-bold transition-[transform,filter] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})
