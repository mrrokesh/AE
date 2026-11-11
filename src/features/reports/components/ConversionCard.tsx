import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, Badge, Card, Tabs } from '@/components/ui'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useCrmStore } from '@/store/crmStore'
import {
  buildStaffConversion,
  CONVERSION_SCOPES,
  leadsInScope,
  type ConversionScope,
} from '../conversion'

/** Conversion by salesperson. Owner-only, like the staff revenue breakdown. */
export function ConversionCard() {
  const { t } = useTranslation()
  const owner = isOwner(useCurrentUser())
  const leads = useCrmStore((s) => s.leads)
  const users = useCrmStore((s) => s.users)
  const products = useCrmStore((s) => s.products)
  const [scope, setScope] = useState<ConversionScope>('computers')
  const rows = useMemo(
    () => buildStaffConversion(leadsInScope(leads, products, scope), users),
    [leads, products, scope, users],
  )
  if (!owner) return null
  const max = Math.max(1, ...rows.map((r) => r.rate))
  return (
    <Card className="mb-4 p-4">
      <h2 className="text-sm font-semibold">{t('reports.conversion.title')}</h2>
      <p className="mb-3 text-xs text-fg-muted">{t('reports.conversion.hint')}</p>
      <div className="mb-4 overflow-x-auto">
        <Tabs
          items={CONVERSION_SCOPES.map((id) => ({
            id,
            label: id === 'all' ? t('common.all') : t(`catalog.group.${id}`),
          }))}
          value={scope}
          onChange={setScope}
        />
      </div>
      <ul className="flex flex-col gap-4">
        {rows.map((r, i) => (
          <li key={r.user.id}>
            <div className="flex items-center gap-2 text-sm">
              <Avatar name={r.user.name} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium">{r.user.name}</span>
              {i === 0 && r.won > 0 && <Badge tone="success">{t('reports.conversion.top')}</Badge>}
              <span className="shrink-0 font-semibold">{r.rate}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${(r.rate / max) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-fg-muted">
              {t('reports.conversion.detail', {
                won: r.won,
                total: r.total,
                lost: r.lost,
                open: r.open,
              })}
              {' · '}
              {r.closedRate === null
                ? t('reports.conversion.noClosed')
                : t('reports.conversion.closedRate', { rate: r.closedRate })}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
