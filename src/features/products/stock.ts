import { productsApi } from '@/services/api'
import { useCrmStore } from '@/store/crmStore'
import type { Product, StockStatus } from '@/types'

export const LOW_STOCK_MAX = 3
export const STOCK_STATUSES: StockStatus[] = ['in_stock', 'low', 'out_of_stock']

export const statusForQty = (qty: number): StockStatus =>
  qty <= 0 ? 'out_of_stock' : qty <= LOW_STOCK_MAX ? 'low' : 'in_stock'

export type StockPatch = {
  stockQty?: number
  stockStatus?: StockStatus
  restockEta?: string | null
}

/** Keeps qty, status and restock date consistent whichever one the owner edits. */
export function normalizeStock(current: Product, patch: StockPatch) {
  let qty = current.stockQty
  let status = current.stockStatus
  if (patch.stockQty !== undefined) {
    qty = Math.max(0, Math.floor(patch.stockQty))
    status = statusForQty(qty)
  } else if (patch.stockStatus) {
    status = patch.stockStatus
    if (status === 'out_of_stock') qty = 0
    else if (status === 'low') qty = qty >= 1 && qty <= LOW_STOCK_MAX ? qty : 2
    else if (qty <= LOW_STOCK_MAX) qty = 10
  }
  const eta = status === 'out_of_stock' ? (patch.restockEta ?? current.restockEta) : null
  return { stockQty: qty, stockStatus: status, restockEta: eta }
}

export async function updateStock(product: Product, patch: StockPatch): Promise<Product> {
  const next = await productsApi.update(product.id, normalizeStock(product, patch))
  useCrmStore.getState().applyProduct(next)
  return next
}
