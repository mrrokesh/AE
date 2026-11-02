import { useTranslation } from 'react-i18next'
import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface Shell {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

function useOverlayBehavior(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
}

function Header({ title, description, onClose }: Pick<Shell, 'title' | 'description' | 'onClose'>) {
  const { t } = useTranslation()
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label={t('common.close')}
        className="-mt-1 -mr-2"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
}: Shell & { size?: 'sm' | 'md' | 'lg' }) {
  useOverlayBehavior(open, onClose)
  if (!open) return null
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative flex max-h-[90dvh] w-full flex-col rounded-t-xl border border-border bg-surface shadow-xl sm:rounded-xl ${width}`}
      >
        <Header title={title} description={description} onClose={onClose} />
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
}: Shell & { size?: 'sm' | 'md' | 'lg' }) {
  useOverlayBehavior(open, onClose)
  if (!open) return null
  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl' }[size]
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative flex h-full w-full flex-col border-l border-border bg-surface shadow-xl ${width}`}
      >
        <Header title={title} description={description} onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
