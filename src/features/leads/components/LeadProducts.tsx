import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { formatINR } from '@/lib/format'
import { useCrmStore } from '@/store/crmStore'
import type { Lead } from '@/types'
import { StockBadge } from '@/features/products/components/StockBadge'
import { productList } from '../format'

export function LeadProducts({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const products = useCrmStore((s) => s.products)
  const list = productList(lead, products)
  const total = list.reduce((sum, p) => sum + p.sellingPrice * lead.quantity, 0)
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">{t('leadDetail.products')}</h2>
      {list.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('leadDetail.noProducts')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-fg-muted">
                  {p.brand} · {t(`categories.${p.category}`)}
                </p>
                <div className="mt-1">
                  <StockBadge product={p} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatINR(p.sellingPrice)}</p>
                {p.mrp > p.sellingPrice && (
                  <p className="text-xs text-fg-subtle line-through">{formatINR(p.mrp)}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <dl className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-surface-2 p-3 text-xs">
        <div>
          <dt className="text-fg-muted">{t('leadDetail.qty')}</dt>
          <dd className="text-sm font-semibold">{lead.quantity}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">{t('leadDetail.estimate')}</dt>
          <dd className="text-sm font-semibold">{list.length ? formatINR(total) : '—'}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">{t('leadDetail.budget')}</dt>
          <dd className="text-sm font-semibold">{lead.budget ? formatINR(lead.budget) : '—'}</dd>
        </div>
      </dl>
    </Card>
  )
}
