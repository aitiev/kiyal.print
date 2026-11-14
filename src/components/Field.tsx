import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const control =
  'w-full min-h-12 rounded-2xl bg-surface-2 px-4 font-semibold text-ink placeholder:text-muted/70 outline-none ring-2 ring-transparent transition focus:ring-lavender/60'

interface FieldProps {
  label: string
  error?: string
  hint?: ReactNode
  children: (id: string, describedBy: string | undefined, invalid: boolean) => ReactNode
  className?: string
}

/** Label + control + inline error/hint. */
export function Field({ label, error, hint, children, className }: FieldProps) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="px-1 text-sm font-bold text-muted">
        {label}
      </label>
      {children(id, error || hint ? msgId : undefined, !!error)}
      {error ? (
        <p id={msgId} role="alert" className="px-1 text-sm font-bold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="px-1 text-xs font-semibold text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function TextInput({ className, invalid, ...rest }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, invalid && 'ring-danger/60', className)} {...rest} />
  },
)

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function SelectInput({ className, invalid, children, ...rest }, ref) {
    return (
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, 'appearance-none pr-10', invalid && 'ring-danger/60', className)} {...rest}>
        {children}
      </select>
    )
  },
)

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function TextArea({ className, invalid, ...rest }, ref) {
    return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(control, 'min-h-24 py-3', invalid && 'ring-danger/60', className)} {...rest} />
  },
)
