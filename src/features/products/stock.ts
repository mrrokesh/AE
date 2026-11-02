import { productsApi } from '@/services/api'
import { useCrmStore } from '@/store/crmStore'
import type { Product, StockStatus, User } from '@/types'
import { notifyRestock } from './waitlist'

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

/** Saves the stock change. On out_of_stock -> available, waiting customers get a call-now follow-up. */
export async function updateStock(
  product: Product,
  patch: StockPatch,
  by: User,
): Promise<{ product: Product; waiting: number | null }> {
  const next = await productsApi.update(product.id, normalizeStock(product, patch))
  useCrmStore.getState().applyProduct(next)
  const restocked = product.stockStatus === 'out_of_stock' && next.stockStatus !== 'out_of_stock'
  return { product: next, waiting: restocked ? await notifyRestock(next, by) : null }
}
