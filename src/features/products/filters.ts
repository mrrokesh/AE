import type { Product, StockStatus } from '@/types'

export type ProductSort = 'featured' | 'priceAsc' | 'priceDesc'
export interface ProductFilters {
  q: string
  category: string
  brand: string
  stock: '' | StockStatus
  sort: ProductSort
}
export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  q: '',
  category: '',
  brand: '',
  stock: '',
  sort: 'featured',
}

export function filterProducts(products: Product[], f: ProductFilters): Product[] {
  const q = f.q.trim().toLowerCase()
  const rows = products.filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.brand || p.brand === f.brand) &&
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
