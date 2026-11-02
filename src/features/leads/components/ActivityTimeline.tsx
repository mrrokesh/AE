import {
  ArrowRightLeft,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import type { ActivityType } from '@/constants'
import { formatDateTime, formatRelative } from '@/lib/dates'
import { useCrmStore } from '@/store/crmStore'
import type { Lead } from '@/types'
import { activityText } from '../format'

const ICON: Record<ActivityType, LucideIcon> = {
  call: Phone,
  whatsapp: MessageCircle,
  visit: MapPin,
  note: StickyNote,
  stage_change: ArrowRightLeft,
  system: Info,
}

/** Newest-first history of everything that happened on a lead. */
export function ActivityTimeline({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const users = useCrmStore((s) => s.users)
  const items = [...lead.activities].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">{t('leadDetail.timeline')}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('leadDetail.noActivity')}</p>
      ) : (
        <ol className="space-y-4">
          {items.map((a) => {
            const Icon = ICON[a.type]
            return (
              <li key={a.id} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm break-words">{activityText(a, t)}</p>
                  <p className="text-xs text-fg-subtle">
                    {users.find((u) => u.id === a.by)?.name ?? '—'} · {formatDateTime(a.at)} ·{' '}
                    {formatRelative(a.at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
