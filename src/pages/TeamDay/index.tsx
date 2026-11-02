import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { Avatar, Badge, Card } from '@/components/ui'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { leadName } from '@/features/leads/format'
import { buildDayReport, type StaffDay } from '@/features/team/dayReport'
import { formatDate } from '@/lib/dates'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import type { Lead } from '@/types'

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'danger' | 'success'
}) {
  return (
    <div className="rounded-md bg-surface-2 p-2.5">
      <p className="text-[11px] text-fg-muted">{label}</p>
      <p
        className={`text-lg font-semibold ${tone === 'danger' && value > 0 ? 'text-danger' : tone === 'success' && value > 0 ? 'text-success' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function LeadChips({ leads }: { leads: Lead[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {leads.slice(0, 8).map((l) => (
        <Link
          key={l.id}
          to={`/leads/${l.id}`}
          className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-surface-2"
        >
          {leadName(l)}
        </Link>
      ))}
      {leads.length > 8 && (
        <span className="px-1 py-1 text-xs text-fg-muted">+{leads.length - 8}</span>
      )}
    </div>
  )
}

function StaffCard({ day }: { day: StaffDay }) {
  const { t } = useTranslation()
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2.5">
        <Avatar name={day.user.name} />
        <p className="flex-1 font-semibold">{day.user.name}</p>
        {day.missed.length === 0 ? (
          <Badge tone="success">{t('teamDay.allClear')}</Badge>
        ) : (
          <Badge tone="danger">{t('teamDay.missedCount', { count: day.missed.length })}</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t('teamDay.contacts')} value={day.calls + day.whatsapps + day.visits} />
        <Stat label={t('teamDay.won')} value={day.won.length} tone="success" />
        <Stat label={t('teamDay.missed')} value={day.missed.length} tone="danger" />
        <Stat label={t('teamDay.carryOver')} value={day.carryOver.length} />
      </div>
      <p className="text-xs text-fg-muted">
        {t('teamDay.breakdown', {
          calls: day.calls,
          whatsapps: day.whatsapps,
          visits: day.visits,
          tomorrow: day.tomorrow,
        })}
      </p>
      {day.missed.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-danger">{t('teamDay.missedList')}</p>
          <LeadChips leads={day.missed} />
        </div>
      )}
      {day.carryOver.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-fg-muted">{t('teamDay.carryList')}</p>
          <LeadChips leads={day.carryOver} />
        </div>
      )}
    </Card>
  )
}

export default function TeamDay() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { leads, users } = useCrmStore()
  const now = useNow()
  const report = useMemo(() => buildDayReport(leads, users, now), [leads, users, now])
  if (!isOwner(user)) return <Navigate to="/" replace />
  return (
    <>
      <PageHeader
        title={t('teamDay.title')}
        description={t('teamDay.description', { date: formatDate(new Date(now)) })}
      />
      <div className="grid gap-3 xl:grid-cols-2">
        {report.map((d) => (
          <StaffCard key={d.user.id} day={d} />
        ))}
      </div>
    </>
  )
}
