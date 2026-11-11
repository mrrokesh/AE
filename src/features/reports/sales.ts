import type { CategoryId, SourceId } from '@/constants'
import { startOfDayIST } from '@/lib/dates'
import type { Customer, Lead, Product } from '@/types'

export const RANGES = ['7d', '30d', '90d', 'all'] as const
export type RangeId = (typeof RANGES)[number]

const DAY = 86_400_000
const RANGE_DAYS: Record<RangeId, number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null }

/** One invoice, flattened with the lead attribution (staff + source) of the customer. */
export interface Sale {
  customerId: string
  customerName: string
  invoiceNo: string
  at: number
  total: number
  units: number
  staffId: string | null
  source: SourceId | null
  items: { productId: string; name: string; qty: number; revenue: number }[]
}

export interface Slice<K extends string = string> {
  key: K
  revenue: number
  orders: number
}

export interface SalesReport {
  revenue: number
  orders: number
  units: number
  avgOrder: number
  buyers: number
  trend: { at: number; revenue: number; orders: number }[]
  products: { id: string; name: string; units: number; revenue: number }[]
  categories: Slice<CategoryId>[]
  staff: Slice[]
  sources: Slice<SourceId>[]
  topCustomers: { id: string; name: string; revenue: number; orders: number }[]
}

export function buildSales(customers: Customer[], leads: Lead[]): Sale[] {
  const byLead = new Map(leads.map((l) => [l.id, l]))
  return customers.flatMap((c) => {
    const lead = c.leadId ? byLead.get(c.leadId) : undefined
    return c.purchases.map((p) => ({
      customerId: c.id,
      customerName: c.name,
      invoiceNo: p.invoiceNo,
      at: Date.parse(p.date),
      total: p.total,
      units: p.items.reduce((n, i) => n + i.qty, 0),
      staffId: lead?.assignedTo ?? null,
      source: lead?.source ?? null,
      items: p.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        qty: i.qty,
        revenue: i.qty * i.unitPrice,
      })),
    }))
  })
}

export function filterByRange(sales: Sale[], range: RangeId, now: number): Sale[] {
  const days = RANGE_DAYS[range]
  if (days === null) return sales
  const from = startOfDayIST(now) - (days - 1) * DAY
  return sales.filter((s) => s.at >= from && s.at <= now)
}

function add<K extends string>(map: Map<K, Slice<K>>, key: K, revenue: number) {
  const cur = map.get(key) ?? { key, revenue: 0, orders: 0 }
  cur.revenue += revenue
  cur.orders += 1
  map.set(key, cur)
}

const rank = <T extends { revenue: number }>(list: T[]) =>
  list.sort((a, b) => b.revenue - a.revenue)

/** Daily buckets up to 30 days, weekly beyond that. */
function buildTrend(sales: Sale[], range: RangeId, now: number) {
  const days = RANGE_DAYS[range]
  if (!days && !sales.length) return []
  const first = days ? startOfDayIST(now) - (days - 1) * DAY : Math.min(...sales.map((s) => s.at))
  const step = days && days <= 30 ? DAY : 7 * DAY
  const start = startOfDayIST(first)
  const count = Math.floor((startOfDayIST(now) - start) / step) + 1
  const buckets = Array.from({ length: count }, (_, i) => ({
    at: start + i * step,
    revenue: 0,
    orders: 0,
  }))
  for (const s of sales) {
    const b = buckets[Math.min(count - 1, Math.max(0, Math.floor((s.at - start) / step)))]
    b.revenue += s.total
    b.orders += 1
  }
  return buckets
}

export function buildSalesReport(
  sales: Sale[],
  products: Product[],
  range: RangeId,
  now: number,
): SalesReport {
  const cat = new Map(products.map((p) => [p.id, p.category]))
  const prod = new Map<string, { id: string; name: string; units: number; revenue: number }>()
  const categories = new Map<CategoryId, Slice<CategoryId>>()
  const staff = new Map<string, Slice>()
  const sources = new Map<SourceId, Slice<SourceId>>()
  const cust = new Map<string, { id: string; name: string; revenue: number; orders: number }>()

  for (const s of sales) {
    add(staff, s.staffId ?? '', s.total)
    if (s.source) add(sources, s.source, s.total)
    const c = cust.get(s.customerId) ?? {
      id: s.customerId,
      name: s.customerName,
      revenue: 0,
      orders: 0,
    }
    c.revenue += s.total
    c.orders += 1
    cust.set(s.customerId, c)
    for (const i of s.items) {
      const p = prod.get(i.productId) ?? { id: i.productId, name: i.name, units: 0, revenue: 0 }
      p.units += i.qty
      p.revenue += i.revenue
      prod.set(i.productId, p)
      const cid = cat.get(i.productId)
      if (cid) {
        const cur = categories.get(cid) ?? { key: cid, revenue: 0, orders: 0 }
        cur.revenue += i.revenue
        cur.orders += i.qty
        categories.set(cid, cur)
      }
    }
  }
  const revenue = sales.reduce((n, s) => n + s.total, 0)
  return {
    revenue,
    orders: sales.length,
    units: sales.reduce((n, s) => n + s.units, 0),
    avgOrder: sales.length ? Math.round(revenue / sales.length) : 0,
    buyers: cust.size,
    trend: buildTrend(sales, range, now),
    products: rank([...prod.values()]),
    categories: rank([...categories.values()]),
    staff: rank([...staff.values()]),
    sources: rank([...sources.values()]),
    topCustomers: rank([...cust.values()]),
  }
}
