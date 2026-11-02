import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { LeadQuickActions } from '@/features/leads/components/LeadQuickActions'
import { byDue, groupFollowUps } from '@/features/leads/followUps'
import { leadName } from '@/features/leads/format'
import { isUntouched } from '@/features/leads/sla'
import { scoreAll } from '@/features/leads/filters'
import { formatRelative } from '@/lib/dates'
import { useNow } from '@/store/clockStore'
import { Kpi } from './Kpi'

/** Phone-first "My day": what to do right now, nothing else. */
export function StaffDashboard() {
  const { t } = useTranslation()
  const leads = useScopedLeads()
  const now = useNow()
  const { todo, g, untouched, hot } = useMemo(() => {
    const g = groupFollowUps(leads, now)
    const untouched = leads.filter(isUntouched)
    const hot = scoreAll(leads, now).filter((r) => !r.closed && r.temperature === 'hot').length
    const seen = new Set<string>()
    const todo = [...untouched, ...g.overdue.slice().sort(byDue), ...g.today.slice().sort(byDue)]
      .filter((l) => !seen.has(l.id) && !!seen.add(l.id))
      .slice(0, 6)
    return { todo, g, untouched, hot }
  }, [leads, now])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Kpi
          label={t('dashboard.overdue')}
          value={g.overdue.length}
          tone={g.overdue.length ? 'danger' : 'success'}
          to="/follow-ups"
        />
        <Kpi
          label={t('dashboard.dueToday')}
          value={g.today.length}
          tone="warning"
          to="/follow-ups"
        />
        <Kpi
          label={t('dashboard.untouched')}
          value={untouched.length}
          tone={untouched.length ? 'danger' : 'success'}
          to="/leads?untouched=1"
        />
        <Kpi label={t('dashboard.hotLeads')} value={hot} to="/leads?temp=hot" />
      </div>
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">{t('dashboard.doNext')}</h2>
        {todo.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">{t('dashboard.allDone')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {todo.map((l) => (
              <li key={l.id} className="space-y-2 py-3 first:pt-0">
                <div className="flex items-baseline justify-between gap-2">
                  <Link to={`/leads/${l.id}`} className="font-medium hover:underline">
                    {leadName(l)}
                  </Link>
                  <span className="text-xs text-fg-muted">
                    {l.nextFollowUpAt
                      ? formatRelative(l.nextFollowUpAt)
                      : t('dashboard.newEnquiry')}
                  </span>
                </div>
                <LeadQuickActions lead={l} compact />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
