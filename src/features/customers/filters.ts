import type { Customer } from '@/types'

export type CustomerSort = 'recent' | 'spent' | 'name'

export const lastPurchaseAt = (c: Customer) =>
  c.purchases.reduce((m, p) => Math.max(m, Date.parse(p.date)), Date.parse(c.createdAt))

/** Search by name, business, phone, city, email or invoice number. */
export function filterCustomers(list: Customer[], search: string, sort: CustomerSort): Customer[] {
  const q = search.trim().toLowerCase()
  const digits = q.replace(/\D/g, '')
  const hit = (c: Customer) =>
    !q ||
    [c.name, c.businessName, c.city, c.email].some((v) => v.toLowerCase().includes(q)) ||
    (digits.length >= 3 && c.phone.includes(digits)) ||
    c.purchases.some((p) => p.invoiceNo.toLowerCase().includes(q))
  const by: Record<CustomerSort, (a: Customer, b: Customer) => number> = {
    recent: (a, b) => lastPurchaseAt(b) - lastPurchaseAt(a),
    spent: (a, b) => b.totalSpent - a.totalSpent,
    name: (a, b) => a.name.localeCompare(b.name),
  }
  return list.filter(hit).sort(by[sort])
}

export function customerTotals(list: Customer[]) {
  return {
    count: list.length,
    spent: list.reduce((n, c) => n + c.totalSpent, 0),
    orders: list.reduce((n, c) => n + c.purchases.length, 0),
    repeat: list.filter((c) => c.purchases.length > 1).length,
  }
}
