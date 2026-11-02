import { isOpenStage } from '@/constants'
import type { Lead, Product } from '@/types'

export interface StockDemand {
  product: Product
  /** Open leads (and leads lost to "out of stock") that want this product. */
  leads: Lead[]
  /** Leads that were saved by switching to an in-stock alternative. */
  saved: Lead[]
  /** Leads still depending on the stocked-out product. */
  atRisk: Lead[]
  /** Estimated sale value of `atRisk`. */
  value: number
  /** Enquiries created in the last 7 days. */
  weekCount: number
}

const DAY = 86_400_000

export const wasSavedByAlternative = (lead: Lead, productId: string) =>
  lead.activities.some((a) => a.key === 'act.alternativeAdded' && a.params?.fromId === productId)

/** Demand lost to stock-outs, per out-of-stock product, biggest ₹ value first. */
export function stockDemand(leads: Lead[], products: Product[], now: number): StockDemand[] {
  return products
    .filter((p) => p.stockStatus === 'out_of_stock')
    .map((product) => {
      const mine = leads.filter(
        (l) =>
          l.productInterest.includes(product.id) &&
          (isOpenStage(l.stage) || (l.stage === 'lost' && l.lostReason === 'out_of_stock')),
      )
      const saved = mine.filter((l) => wasSavedByAlternative(l, product.id) && isOpenStage(l.stage))
      const atRisk = mine.filter((l) => !saved.includes(l))
      return {
        product,
        leads: mine,
        saved,
        atRisk,
        value: atRisk.reduce((s, l) => s + product.sellingPrice * l.quantity, 0),
        weekCount: mine.filter((l) => now - Date.parse(l.createdAt) <= 7 * DAY).length,
      }
    })
    .filter((d) => d.leads.length > 0)
    .sort((a, b) => b.value - a.value)
}
