import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-2xl bg-surface-2', className)} />
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  )
}
