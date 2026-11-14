import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Sheet } from './Sheet'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'
import { useT } from '@/hooks/useT'

interface Props<Row> {
  open: boolean
  onClose: () => void
  title: string
  formId: string
  /** Edit mode id; undefined = create. */
  id?: string
  /** Live row: undefined = loading, null = not found. Ignored in create mode. */
  row: Row | undefined | null
  notFoundText: string
  deleteLabel: string
  onDelete: (row: Row) => Promise<boolean>
  children: (row: Row | undefined) => ReactNode
}

/** Create/edit sheet frame: loading skeleton, not-found state, footer with Save (+ Delete in edit mode). */
export function FormSheet<Row>({ open, onClose, title, formId, id, row, notFoundText, deleteLabel, onDelete, children }: Props<Row>) {
  const { t } = useT()
  const save = (
    <Button type="submit" form={formId} block>
      {t('common.save')}
    </Button>
  )
  const footer = !id ? (
    save
  ) : row ? (
    <div className="flex gap-3">
      <Button
        variant="danger"
        size="icon"
        className="h-12 w-12 shrink-0"
        aria-label={deleteLabel}
        title={deleteLabel}
        onClick={async () => (await onDelete(row)) && onClose()}
      >
        <Trash2 size={20} />
      </Button>
      {save}
    </div>
  ) : undefined

  return (
    <Sheet open={open} onClose={onClose} title={title} footer={footer}>
      {id && row === undefined ? (
        <div className="flex flex-col gap-4 pt-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : id && row === null ? (
        <EmptyState emoji="🔍" title={notFoundText} />
      ) : (
        children(row ?? undefined)
      )}
    </Sheet>
  )
}
