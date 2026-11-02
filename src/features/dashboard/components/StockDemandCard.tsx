import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PackageX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { stockDemand } from '@/features/products/demand'
import { formatINRCompact } from '@/lib/format'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'

/** Owner insight: sales at risk because the product is out of stock, and which ones to restock. */
export function StockDemandCard() {
  const { t } = useTranslation()
  const leads = useScopedLeads()
  const products = useCrmStore((s) => s.products)
  const now = useNow()
  const rows = useMemo(() => stockDemand(leads, products, now), [leads, products, now])
  const totalLeads = rows.reduce((s, r) => s + r.atRisk.length, 0)
  const totalValue = rows.reduce((s, r) => s + r.value, 0)
  return (
    <Card className="p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <PackageX className="size-4 text-warning" />
        {t('catalog.demand.title')}
      </h2>
      <p className="mb-3 text-xs text-fg-muted">
        {rows.length
          ? t('catalog.demand.total', { leads: totalLeads, value: formatINRCompact(totalValue) })
          : t('catalog.demand.subtitle')}
      </p>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-fg-muted">{t('catalog.demand.none')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.slice(0, 6).map((r) => (
            <li
              key={r.product.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0"
            >
              <div className="min-w-0">
                <Link
                  to={`/leads?product=${r.product.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {r.product.name}
                </Link>
                {r.saved.length > 0 && (
                  <p className="text-xs text-success">
                    {t('catalog.demand.saved', { count: r.saved.length })}
                  </p>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">
                  {t('catalog.demand.leads', { count: r.atRisk.length })}
                </p>
                <p className="text-xs text-fg-muted">
                  {t('catalog.demand.value', { value: formatINRCompact(r.value) })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
