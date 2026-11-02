import { useTranslation } from 'react-i18next'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useToastStore, type ToastKind } from '@/store/toastStore'

const icons: Record<ToastKind, { Icon: typeof Info; cls: string }> = {
  success: { Icon: CircleCheck, cls: 'text-success' },
  error: { Icon: TriangleAlert, cls: 'text-danger' },
  info: { Icon: Info, cls: 'text-info' },
}

export function ToastViewport() {
  const { t } = useTranslation()
  const { toasts, dismiss } = useToastStore()
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const { Icon, cls } = icons[item.kind]
        return (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-surface p-3 shadow-lg"
          >
            <Icon className={`mt-0.5 size-4 shrink-0 ${cls}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              {item.description && <p className="text-xs text-fg-muted">{item.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label={t('common.dismiss')}
              className="text-fg-subtle hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
