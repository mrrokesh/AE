import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { formatINR } from '@/lib/format'

export interface RevenueRow {
  key: string
  label: string
  revenue: number
  hint?: string
}

/** Ranked list with a proportional bar per row; pure CSS so it works at any width. */
export function RevenueList({ title, rows }: { title: string; rows: RevenueRow[] }) {
  const { t } = useTranslation()
  const max = Math.max(1, ...rows.map((r) => r.revenue))
  const total = rows.reduce((n, r) => n + r.revenue, 0)
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">{t('reports.noSales')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{r.label}</span>
                <span className="shrink-0 font-semibold">{formatINR(r.revenue)}</span>
              </div>
              <div
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"
                role="img"
                aria-label={`${Math.round((r.revenue / total) * 100)}%`}
              >
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${(r.revenue / max) * 100}%` }}
                />
              </div>
              {r.hint && <p className="mt-0.5 text-xs text-fg-subtle">{r.hint}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
