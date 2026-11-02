import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, CalendarClock, Inbox, PackageCheck, Siren } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Popover } from '@/components/ui'
import { leadName } from '@/features/leads/format'
import { useNotifications, type NotificationKind } from '@/features/notifications/useNotifications'
import { formatRelative } from '@/lib/dates'
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '@/lib/notify'
import { useCrmStore } from '@/store/crmStore'
import { useState } from 'react'

const ICON = { restock: PackageCheck, escalation: Siren, enquiry: Inbox, overdue: CalendarClock }
const COLOR: Record<NotificationKind, string> = {
  restock: 'text-success',
  escalation: 'text-danger',
  enquiry: 'text-info',
  overdue: 'text-warning',
}

export function NotificationBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const items = useNotifications()
  const leads = useCrmStore((s) => s.leads)
  const [perm, setPerm] = useState(notificationPermission())

  return (
    <Popover
      panelClassName="w-[min(22rem,calc(100vw-1.5rem))]"
      trigger={({ toggle }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={`${t('bell.title')} (${items.length})`}
          className="relative"
        >
          <Bell className="size-4" />
          {items.length > 0 && (
            <span className="absolute top-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {items.length > 99 ? '99+' : items.length}
            </span>
          )}
        </Button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold">{t('bell.title')}</p>
            {notificationsSupported() && perm === 'default' && (
              <button
                type="button"
                onClick={() => void requestNotificationPermission().then(setPerm)}
                className="flex items-center gap-1 text-xs font-medium text-brand-600"
              >
                <BellRing className="size-3.5" /> {t('bell.enable')}
              </button>
            )}
            {perm === 'denied' && notificationsSupported() && (
              <span className="text-xs text-fg-subtle">{t('bell.blocked')}</span>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-fg-muted">{t('bell.empty')}</li>
            )}
            {items.slice(0, 30).map((n) => {
              const lead = leads.find((l) => l.id === n.leadId)
              if (!lead) return null
              const Icon = ICON[n.kind]
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      navigate(n.kind === 'enquiry' ? '/inbox' : `/leads/${lead.id}`)
                    }}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface-2"
                  >
                    <Icon className={`mt-0.5 size-4 shrink-0 ${COLOR[n.kind]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{leadName(lead)}</span>
                      <span className="block text-xs text-fg-muted">
                        {t(`bell.kind.${n.kind}`)} · {formatRelative(new Date(n.at))}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Popover>
  )
}
