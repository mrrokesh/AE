import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { Tone } from '@/constants'
import { formatDate } from '@/lib/dates'
import type { Product, StockStatus } from '@/types'

const TONE: Record<StockStatus, Tone> = {
  in_stock: 'success',
  low: 'warning',
  out_of_stock: 'danger',
}

export function StockBadge({ product }: { product: Product }) {
  const { t } = useTranslation()
  const { stockStatus: s, stockQty: qty, restockEta } = product
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Badge tone={TONE[s]}>
        {s === 'low' ? t('catalog.stock.lowQty', { count: qty }) : t(`catalog.stock.${s}`)}
      </Badge>
      {s === 'out_of_stock' && (
        <span className="text-[11px] text-fg-muted">
          {restockEta
            ? t('catalog.restockOn', { date: formatDate(restockEta) })
            : t('catalog.restockUnknown')}
        </span>
      )}
    </span>
  )
}
