export type Tone = 'peach' | 'mint' | 'lavender' | 'sun' | 'danger' | 'neutral'

/** Soft background + strong foreground per tone (pastel badge look). */
export const toneSoft: Record<Tone, string> = {
  peach: 'bg-peach-soft text-peach',
  mint: 'bg-mint-soft text-mint',
  lavender: 'bg-lavender-soft text-lavender',
  sun: 'bg-sun-soft text-sun',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-2 text-muted',
}
export const toneSolid: Record<Tone, string> = {
  peach: 'bg-peach text-on-accent',
  mint: 'bg-mint text-on-accent',
  lavender: 'bg-lavender text-on-accent',
  sun: 'bg-sun text-on-accent',
  danger: 'bg-danger text-on-accent',
  neutral: 'bg-ink text-bg',
}
