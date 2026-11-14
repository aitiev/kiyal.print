import { useUI } from '@/store/ui'
import { useT } from '@/hooks/useT'
import { Sheet } from './Sheet'
import { Button } from './Button'

/** Renders the promise-based confirmDialog() requests. Mount once. */
export function ConfirmHost() {
  const req = useUI((s) => s.confirm)
  const { t } = useT()
  return (
    <Sheet open={!!req} onClose={() => req?.resolve(false)} title={req?.title ?? ''} size="sm">
      {req?.body && <p className="pb-4 font-semibold text-muted">{req.body}</p>}
      <div className="flex gap-3 pb-2">
        <Button variant="secondary" block onClick={() => req?.resolve(false)}>
          {t('common.cancel')}
        </Button>
        <Button variant={req?.danger ? 'danger' : 'primary'} block onClick={() => req?.resolve(true)}>
          {req?.confirmLabel ?? t('common.confirm')}
        </Button>
      </div>
    </Sheet>
  )
}
