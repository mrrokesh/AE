import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { StageBadge } from '@/components/StageBadge'
import { Badge, Card, EmptyState, Select } from '@/components/ui'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { LeadQuickActions } from '@/features/leads/components/LeadQuickActions'
import { TemperatureBadge } from '@/features/leads/components/TemperatureBadge'
import { activityText, leadName, productSummary } from '@/features/leads/format'
import { useTemperature } from '@/features/leads/temperature'
import { useFollowUps } from '@/features/leads/useFollowUps'
import { cn } from '@/lib/cn'
import { formatDateTime, formatRelative } from '@/lib/dates'
import { formatPhone } from '@/lib/format'
import { useCrmStore } from '@/store/crmStore'
import type { Lead } from '@/types'

type Tab = 'overdue' | 'today' | 'upcoming' | 'done'

function Row({ lead, tab }: { lead: Lead; tab: Exclude<Tab, 'done'> }) {
  const products = useCrmStore((s) => s.products)
  const users = useCrmStore((s) => s.users)
  const { temperature } = useTemperature(lead)
  return (
    <li
      className={cn(
        'space-y-2.5 border-l-4 p-3.5',
        tab === 'overdue'
          ? 'border-l-danger'
          : tab === 'today'
            ? 'border-l-warning'
            : 'border-l-transparent',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/leads/${lead.id}`} className="font-semibold hover:underline">
            {leadName(lead)}
          </Link>
          <p className="text-xs text-fg-muted">
            {formatPhone(lead.phone)} · {lead.city} · {productSummary(lead, products) || '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StageBadge stage={lead.stage} />
          <TemperatureBadge temperature={temperature} />
        </div>
      </div>
      <p className={cn('text-xs', tab === 'overdue' ? 'font-medium text-danger' : 'text-fg-muted')}>
        {formatDateTime(lead.nextFollowUpAt)} · {formatRelative(lead.nextFollowUpAt)}
        {lead.assignedTo && ` · ${users.find((u) => u.id === lead.assignedTo)?.name ?? ''}`}
      </p>
      <LeadQuickActions lead={lead} />
    </li>
  )
}

export default function FollowUps() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const users = useCrmStore((s) => s.users)
  const [tab, setTab] = useState<Tab>('overdue')
  const [assignee, setAssignee] = useState('')
  const { groups, done } = useFollowUps(assignee)

  const tabs: { id: Tab; count: number; tone: 'danger' | 'warning' | 'neutral' }[] = [
    { id: 'overdue', count: groups.overdue.length, tone: 'danger' },
    { id: 'today', count: groups.today.length, tone: 'warning' },
    { id: 'upcoming', count: groups.upcoming.length, tone: 'neutral' },
    { id: 'done', count: done.length, tone: 'neutral' },
  ]

  return (
    <>
      <PageHeader
        title={t('followUps.title')}
        description={t('followUps.description')}
        actions={
          isOwner(user) && (
            <Select
              aria-label={t('followUps.assignee')}
              className="w-44"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder={t('followUps.everyone')}
              options={users
                .filter((u) => u.role === 'staff')
                .map((u) => ({ value: u.id, label: u.name }))}
            />
          )
        }
      />
      <div role="tablist" className="mb-3 flex gap-1 overflow-x-auto rounded-lg bg-surface-2 p-0.5">
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
              tab === x.id ? 'bg-surface shadow-sm' : 'text-fg-muted',
            )}
          >
            {t(`followUps.tabs.${x.id}`)}
            <Badge tone={x.count > 0 ? x.tone : 'neutral'}>{x.count}</Badge>
          </button>
        ))}
      </div>
      <Card>
        {tab === 'done' ? (
          done.length === 0 ? (
            <EmptyState icon={CalendarCheck} title={t('followUps.empty.done')} />
          ) : (
            <ul className="divide-y divide-border">
              {done.slice(0, 60).map(({ lead, activity }) => (
                <li
                  key={activity.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3.5"
                >
                  <div className="min-w-0">
                    <Link to={`/leads/${lead.id}`} className="font-medium hover:underline">
                      {leadName(lead)}
                    </Link>
                    <p className="text-xs text-fg-muted">
                      {t(`activityTypes.${activity.type}`)} · {activityText(activity, t)}
                    </p>
                  </div>
                  <span className="text-xs text-fg-subtle">
                    {users.find((u) => u.id === activity.by)?.name} · {formatRelative(activity.at)}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : groups[tab].length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={t(`followUps.empty.${tab}`)}
            description={t('followUps.empty.text')}
          />
        ) : (
          <ul className="divide-y divide-border">
            {groups[tab].map((l) => (
              <Row key={l.id} lead={l} tab={tab} />
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
