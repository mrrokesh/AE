import { useTranslation } from 'react-i18next'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import type { User } from '@/types'
import type { SalesReport } from '../sales'
import { RevenueList } from './RevenueList'

/** The four ranked breakdowns of the sales report. Staff breakdown is owner-only. */
export function SalesBreakdowns({ report, users }: { report: SalesReport; users: User[] }) {
  const { t } = useTranslation()
  const owner = isOwner(useCurrentUser())
  const orders = (n: number) => t('reports.orders', { count: n })
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
      <RevenueList
        title={t('reports.byProduct')}
        rows={report.products.slice(0, 8).map((p) => ({
          key: p.id,
          label: p.name,
          revenue: p.revenue,
          hint: t('reports.units', { count: p.units }),
        }))}
      />
      <RevenueList
        title={t('reports.byCategory')}
        rows={report.categories.map((c) => ({
          key: c.key,
          label: t(`categories.${c.key}`),
          revenue: c.revenue,
          hint: t('reports.units', { count: c.orders }),
        }))}
      />
      {owner && (
        <RevenueList
          title={t('reports.byStaff')}
          rows={report.staff.map((s) => ({
            key: s.key || 'none',
            label: users.find((u) => u.id === s.key)?.name ?? t('common.unassigned'),
            revenue: s.revenue,
            hint: orders(s.orders),
          }))}
        />
      )}
      <RevenueList
        title={t('reports.bySource')}
        rows={report.sources.map((s) => ({
          key: s.key,
          label: t(`sources.${s.key}`),
          revenue: s.revenue,
          hint: orders(s.orders),
        }))}
      />
      <RevenueList
        title={t('reports.topCustomers')}
        rows={report.topCustomers.slice(0, 5).map((c) => ({
          key: c.id,
          label: c.name,
          revenue: c.revenue,
          hint: orders(c.orders),
        }))}
      />
    </div>
  )
}
