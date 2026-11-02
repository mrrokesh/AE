import { useMemo, useState } from 'react'
import { useCrmStore } from '@/store/crmStore'
import {
  DEFAULT_PRODUCT_FILTERS,
  filterProducts,
  stockCounts,
  type ProductFilters,
} from './filters'

const PAGE = 24

/** Filter/sort/paginate state for the Products page. */
export function useProductBrowser() {
  const products = useCrmStore((s) => s.products)
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS)
  const [shown, setShown] = useState(PAGE)
  const rows = useMemo(() => filterProducts(products, filters), [products, filters])
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products])
  return {
    filters,
    update: (patch: Partial<ProductFilters>) => {
      setFilters((f) => ({ ...f, ...patch }))
      setShown(PAGE)
    },
    rows: rows.slice(0, shown),
    total: rows.length,
    hasMore: rows.length > shown,
    showMore: () => setShown((n) => n + PAGE),
    brands,
    counts: useMemo(() => stockCounts(products), [products]),
  }
}
