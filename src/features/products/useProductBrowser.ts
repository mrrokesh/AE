import { useMemo, useState } from 'react'
import { useCrmStore } from '@/store/crmStore'
import {
  DEFAULT_PRODUCT_FILTERS,
  facetCounts,
  filterProducts,
  groupCounts,
  inGroup,
  stockCounts,
  type ProductFilters,
} from './filters'

const PAGE = 24
const SUB_FILTERS_RESET = {
  category: '',
  brand: '',
  connectivity: '',
  color: '',
  waterproof: false,
} as const

/** Filter/sort/paginate state for the Products page. */
export function useProductBrowser() {
  const products = useCrmStore((s) => s.products)
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS)
  const [shown, setShown] = useState(PAGE)
  const rows = useMemo(() => filterProducts(products, filters), [products, filters])
  const scoped = useMemo(() => inGroup(products, filters.group), [products, filters.group])
  return {
    filters,
    update: (patch: Partial<ProductFilters>) => {
      // Switching section clears the sub-filters that belonged to the old one.
      const reset = patch.group !== undefined && patch.group !== filters.group
      setFilters((f) => ({ ...f, ...(reset ? SUB_FILTERS_RESET : {}), ...patch }))
      setShown(PAGE)
    },
    rows: rows.slice(0, shown),
    total: rows.length,
    hasMore: rows.length > shown,
    showMore: () => setShown((n) => n + PAGE),
    brands: useMemo(
      () =>
        facetCounts(scoped, (p) => p.brand)
          .map(([b]) => b)
          .sort(),
      [scoped],
    ),
    types: useMemo(() => facetCounts(scoped, (p) => p.category), [scoped]),
    connectivity: useMemo(() => facetCounts(scoped, (p) => p.specs.connectivity), [scoped]),
    groups: useMemo(() => groupCounts(products), [products]),
    counts: useMemo(() => stockCounts(scoped), [scoped]),
  }
}
