import { groupOfCategory, PRODUCT_GROUPS, type ProductGroupId } from '@/constants'
import type { Connectivity, Product, StockStatus } from '@/types'

export type ProductSort = 'featured' | 'priceAsc' | 'priceDesc'
export interface ProductFilters {
  q: string
  /** Top-level section: printers / speakers / laptop accessories ('' = all). */
  group: '' | ProductGroupId
  /** Product type within the group (printer kind). */
  category: string
  brand: string
  connectivity: string
  color: '' | 'mono' | 'color'
  waterproof: boolean
  stock: '' | StockStatus
  sort: ProductSort
}
export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  q: '',
  group: '',
  category: '',
  brand: '',
  connectivity: '',
  color: '',
  waterproof: false,
  stock: '',
  sort: 'featured',
}

export const inGroup = (products: Product[], group: ProductFilters['group']) =>
  group ? products.filter((p) => groupOfCategory(p.category) === group) : products

export function filterProducts(products: Product[], f: ProductFilters): Product[] {
  const q = f.q.trim().toLowerCase()
  const rows = inGroup(products, f.group).filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.brand || p.brand === f.brand) &&
      (!f.connectivity || !!p.specs.connectivity?.includes(f.connectivity as Connectivity)) &&
      (!f.color || p.specs.color === f.color) &&
      (!f.waterproof || !!p.specs.waterproof) &&
      (!f.stock || p.stockStatus === f.stock) &&
      (!q || `${p.name} ${p.brand}`.toLowerCase().includes(q)),
  )
  if (f.sort === 'priceAsc') rows.sort((a, b) => a.sellingPrice - b.sellingPrice)
  if (f.sort === 'priceDesc') rows.sort((a, b) => b.sellingPrice - a.sellingPrice)
  return rows
}

export const stockCounts = (products: Product[]) => ({
  all: products.length,
  in_stock: products.filter((p) => p.stockStatus === 'in_stock').length,
  low: products.filter((p) => p.stockStatus === 'low').length,
  out_of_stock: products.filter((p) => p.stockStatus === 'out_of_stock').length,
})

/** Products per top-level group. */
export const groupCounts = (products: Product[]) =>
  Object.fromEntries(PRODUCT_GROUPS.map((g) => [g.id, inGroup(products, g.id).length])) as Record<
    ProductGroupId,
    number
  >

/** Value -> count for a spec/field inside the current group, biggest first. */
export function facetCounts(
  products: Product[],
  pick: (p: Product) => string | string[] | null | undefined,
): [string, number][] {
  const m = new Map<string, number>()
  for (const p of products) {
    const v = pick(p)
    for (const x of Array.isArray(v) ? v : v ? [v] : []) m.set(x, (m.get(x) ?? 0) + 1)
  }
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}
