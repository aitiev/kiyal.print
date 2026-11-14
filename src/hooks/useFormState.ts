import { useRef, useState } from 'react'
import type { MsgKey } from '@/lib/i18n'
import type { Errors, ParseResult } from '@/lib/validation'
import { useT } from './useT'

/**
 * Raw-string form state + validation for simple sheet forms.
 * Errors appear after the first submit and then update live.
 */
export function useFormState<F extends object, T>(initial: () => F, parse: (f: F) => ParseResult<F, T>) {
  const { t } = useT()
  const formRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<F>(initial)
  const [errors, setErrors] = useState<Errors<F>>({})
  const [submitted, setSubmitted] = useState(false)

  const update = (patch: Partial<F>) => {
    const next = { ...form, ...patch }
    setForm(next)
    if (submitted) {
      const r = parse(next)
      setErrors(r.ok ? {} : r.errors)
    }
  }

  const err = (k: keyof F): string | undefined => {
    const key = errors[k] as MsgKey | undefined
    return key ? t(key) : undefined
  }

  /** Validates; on success calls `onValid`, otherwise shows errors and focuses the first invalid field. */
  const handleSubmit = (onValid: (value: T) => Promise<void> | void) => async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const r = parse(form)
    if (!r.ok) {
      setErrors(r.errors)
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setErrors({})
    await onValid(r.value)
  }

  return { form, update, err, errors, handleSubmit, formRef }
}
