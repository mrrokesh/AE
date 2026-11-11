import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { formatINR, formatINRCompact } from '@/lib/format'
import type { SalesReport } from '../sales'

const shortDate = (at: number) => formatDate(new Date(at)).slice(0, 6)

/** Revenue over time (daily up to 30 days, weekly beyond). */
export function RevenueTrend({ trend }: { trend: SalesReport['trend'] }) {
  const { t } = useTranslation()
  const title = t('reports.trend')
  const has = trend.some((b) => b.revenue > 0)
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {!has ? (
        <p className="py-10 text-center text-sm text-fg-muted">{t('reports.noSales')}</p>
      ) : (
        <div className="h-60" role="img" aria-label={title}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="at"
                tickFormatter={shortDate}
                minTickGap={24}
                tick={{ fill: 'var(--color-fg-muted)', fontSize: 11 }}
                stroke="var(--color-border)"
              />
              <YAxis
                width={56}
                tickFormatter={(v: number) => formatINRCompact(v)}
                tick={{ fill: 'var(--color-fg-muted)', fontSize: 11 }}
                stroke="var(--color-border)"
              />
              <Tooltip
                labelFormatter={(at) => formatDate(new Date(Number(at)))}
                formatter={(v) => formatINR(Number(v))}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: 'var(--color-surface-2)' }}
              />
              <Bar dataKey="revenue" fill="var(--color-brand-600)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
