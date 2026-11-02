import { useTranslation } from 'react-i18next'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { formatINR } from '@/lib/format'
import type { Product } from '@/types'
import { ProductImage } from './ProductImage'
import { OutOfStockExtras } from './OutOfStockExtras'
import { SpecChips } from './SpecChips'
import { StockBadge } from './StockBadge'
import { StockEditor } from './StockEditor'

export function ProductsTable({
  rows,
  waiting,
}: {
  rows: Product[]
  waiting: Map<string, number>
}) {
  const { t } = useTranslation()
  const owner = isOwner(useCurrentUser())
  return (
    <Table>
      <THead>
        <tr>
          <Th>{t('catalog.col.product')}</Th>
          <Th>{t('catalog.col.price')}</Th>
          <Th>{t('catalog.col.stock')}</Th>
          <Th>{t('catalog.col.specs')}</Th>
          {owner && <Th>{t('catalog.col.edit')}</Th>}
        </tr>
      </THead>
      <TBody>
        {rows.map((p) => (
          <Tr key={p.id}>
            <Td>
              <div className="flex min-w-56 items-center gap-3">
                <ProductImage
                  src={p.images[0]}
                  alt={p.name}
                  className="size-12 shrink-0 rounded-md border border-border"
                />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-fg-muted">
                    {p.brand} · {t(`categories.${p.category}`)}
                  </p>
                </div>
              </div>
            </Td>
            <Td>
              <p className="font-semibold">{formatINR(p.sellingPrice)}</p>
              {p.mrp > p.sellingPrice && (
                <p className="text-xs text-fg-subtle line-through">{formatINR(p.mrp)}</p>
              )}
            </Td>
            <Td>
              <div className="min-w-52 space-y-1.5">
                <StockBadge product={p} />
                {p.stockStatus === 'out_of_stock' && (
                  <OutOfStockExtras product={p} waiting={waiting.get(p.id) ?? 0} />
                )}
              </div>
            </Td>
            <Td>
              <div className="max-w-64">
                <SpecChips product={p} max={4} />
              </div>
            </Td>
            {owner && (
              <Td>
                <StockEditor product={p} />
              </Td>
            )}
          </Tr>
        ))}
      </TBody>
    </Table>
  )
}
