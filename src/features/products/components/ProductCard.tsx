import { formatINR } from '@/lib/format'
import { Badge } from '@/components/ui'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import type { Product } from '@/types'
import { ProductImage } from './ProductImage'
import { SpecChips } from './SpecChips'
import { StockBadge } from './StockBadge'
import { StockEditor } from './StockEditor'
import { useTranslation } from 'react-i18next'

export function ProductCard({ product: p }: { product: Product }) {
  const { t } = useTranslation()
  const owner = isOwner(useCurrentUser())
  const off = p.mrp > p.sellingPrice ? Math.round((1 - p.sellingPrice / p.mrp) * 100) : 0
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <ProductImage
        src={p.images[0]}
        alt={p.name}
        className="aspect-square w-full border-b border-border"
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="text-xs text-fg-muted">
            {p.brand} · {t(`categories.${p.category}`)}
          </p>
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
            {p.url ? (
              <a href={p.url} target="_blank" rel="noreferrer" className="hover:underline">
                {p.name}
              </a>
            ) : (
              p.name
            )}
          </h3>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-semibold">{formatINR(p.sellingPrice)}</span>
          {off > 0 && (
            <>
              <span className="text-xs text-fg-subtle line-through">{formatINR(p.mrp)}</span>
              <Badge tone="success">{t('catalog.off', { pct: off })}</Badge>
            </>
          )}
        </div>
        <StockBadge product={p} />
        <SpecChips product={p} />
        {owner && (
          <div className="mt-auto border-t border-border pt-2">
            <StockEditor product={p} />
          </div>
        )}
      </div>
    </article>
  )
}
