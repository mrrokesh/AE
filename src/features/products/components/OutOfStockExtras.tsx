import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatINR } from '@/lib/format'
import { useCrmStore } from '@/store/crmStore'
import type { Product } from '@/types'
import { findAlternatives } from '../similarity'

/** Under an out-of-stock product: how many leads are waiting and the closest in-stock alternatives. */
export function OutOfStockExtras({ product, waiting }: { product: Product; waiting: number }) {
  const { t } = useTranslation()
  const products = useCrmStore((s) => s.products)
  const alts = useMemo(() => findAlternatives(product, products, 3), [product, products])
  return (
    <div className="space-y-1.5 rounded-md bg-warning/10 p-2 text-xs">
      {waiting > 0 && (
        <Link
          to={`/leads?product=${product.id}`}
          className="block font-medium text-warning hover:underline"
        >
          {t('catalog.alt.waiting', { count: waiting })}
        </Link>
      )}
      <p className="font-medium text-fg-muted">{t('catalog.alt.similar')}</p>
      {alts.length === 0 ? (
        <p className="text-fg-muted">{t('catalog.alt.noSimilar')}</p>
      ) : (
        <ul className="space-y-0.5">
          {alts.map((a) => (
            <li key={a.product.id} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">{a.product.name}</span>
              <span className="shrink-0 text-fg-muted">
                {formatINR(a.product.sellingPrice)} · {a.score}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
