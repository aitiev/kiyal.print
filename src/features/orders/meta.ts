import type { PaymentStatus, Product, WorkStatus } from '@/db/types'
import type { Tone } from '@/components/tone'

export const paymentTone: Record<PaymentStatus, Tone> = { paid: 'mint', half: 'sun', unpaid: 'danger' }
export const workTone: Record<WorkStatus, Tone> = { new: 'lavender', in_progress: 'peach', ready: 'mint', delivered: 'neutral' }
export const productTone: Record<Product, Tone> = { colouring_book: 'peach', velcro_book: 'lavender', other: 'sun' }
export const productEmoji: Record<Product, string> = { colouring_book: '🖍️', velcro_book: '🧩', other: '🎁' }
