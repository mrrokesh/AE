import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { formatMinutes } from '@/features/leads/sla'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import { buildOwnerStats } from '../stats'
import { AtRiskCard } from './AtRiskCard'
import { StockDemandCard } from './StockDemandCard'
import { BarChartCard } from './BarChartCard'
import { BriefingCard } from './BriefingCard'
import { Kpi } from './Kpi'
import { Leaderboard } from './Leaderboard'

export function OwnerDashboard() {
  const { t } = useTranslation()
  const leads = useScopedLeads()
  const users = useCrmStore((s) => s.users)
  const now = useNow()
  const s = useMemo(() => buildOwnerStats(leads, users, now), [leads, users, now])
  const overdueTotal = s.overduePerStaff.reduce((a, b) => a + b.count, 0)
  return (
    <div className="space-y-4">
      <BriefingCard />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t('dashboard.enquiriesToday')} value={s.todayTotal} to="/leads" />
        <Kpi
          label={t('dashboard.untouched')}
          value={s.untouched.length}
          tone={s.untouched.length ? 'danger' : 'success'}
          to="/leads?untouched=1"
        />
        <Kpi
          label={t('dashboard.overdue')}
          value={overdueTotal}
          tone={overdueTotal ? 'danger' : 'success'}
          to="/leads?bucket=overdue"
        />
        <Kpi
          label={t('dashboard.avgResponse')}
          value={s.avgResponseMin === null ? '—' : formatMinutes(s.avgResponseMin)}
          tone="warning"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard
          title={t('dashboard.todayBySource')}
          empty={t('dashboard.noData')}
          data={s.todayBySource.map((d) => ({ name: t(`sources.${d.id}`), value: d.count }))}
        />
        <BarChartCard
          title={t('dashboard.overduePerStaff')}
          empty={t('dashboard.noneOverdue')}
          data={s.overduePerStaff.map((d) => ({ name: d.user.name.split(' ')[0], value: d.count }))}
        />
        <BarChartCard
          title={t('dashboard.conversion')}
          unit="%"
          empty={t('dashboard.noData')}
          data={s.conversion.map((d) => ({ name: t(`sources.${d.id}`), value: d.rate }))}
        />
        <BarChartCard
          title={t('dashboard.lostReasons')}
          empty={t('dashboard.noData')}
          data={s.lostReasons.map((d) => ({ name: t(`lostReasons.${d.id}`), value: d.count }))}
        />
        <Leaderboard rows={s.leaderboard} />
        <AtRiskCard />
        <StockDemandCard />
      </div>
    </div>
  )
}
