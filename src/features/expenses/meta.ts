import type { ExpenseCategory } from '@/db/types'
import type { Tone } from '@/components/tone'

export const categoryTone: Record<ExpenseCategory, Tone> = {
  paper: 'lavender',
  printing: 'peach',
  velcro_felt: 'mint',
  packaging: 'sun',
  other: 'neutral',
}
/** Solid fill per category (static class names so Tailwind can see them). */
export const categoryFill: Record<ExpenseCategory, string> = {
  paper: 'bg-lavender',
  printing: 'bg-peach',
  velcro_felt: 'bg-mint',
  packaging: 'bg-sun',
  other: 'bg-muted',
}
export const categoryEmoji: Record<ExpenseCategory, string> = {
  paper: '📄',
  printing: '🖨️',
  velcro_felt: '🧵',
  packaging: '📦',
  other: '✨',
}
export const UNIT_KEYS = ['sheets', 'pcs', 'meters', 'packs', 'strings'] as const
export const CHANNEL_KEYS = ['instagram', 'telegram', 'whatsapp', 'blogger', 'flyers'] as const
