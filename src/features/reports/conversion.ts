import { groupOfCategory, type ProductGroupId } from '@/constants'
import type { Lead, Product, User } from '@/types'

export type ConversionScope = 'all' | ProductGroupId
export const CONVERSION_SCOPES: ConversionScope[] = ['all', 'computers', 'accessories', 'printers', 'speakers']

/** Leads that asked for at least one product in the group. */
export function leadsInScope(leads: Lead[], products: Product[], scope: ConversionScope): Lead[] {
  if (scope === 'all') return leads
  const ids = new Set(
    products.filter((p) => groupOfCategory(p.category) === scope).map((p) => p.id),
  )
  return leads.filter((l) => l.productInterest.some((id) => ids.has(id)))
}

export interface StaffConversion {
  user: User
  total: number
  won: number
  lost: number
  open: number
  /** won / all assigned leads, 0-100 */
  rate: number
  /** won / (won + lost), 0-100; null until a lead is closed */
  closedRate: number | null
}

const pct = (a: number, b: number) => Math.round((a / b) * 1000) / 10

/** Conversion per salesperson, best first (ties broken by more wins, then more leads). */
export function buildStaffConversion(leads: Lead[], users: User[]): StaffConversion[] {
  return users
    .filter((u) => u.role === 'staff')
    .map((user) => {
      const mine = leads.filter((l) => l.assignedTo === user.id)
      const won = mine.filter((l) => l.stage === 'won').length
      const lost = mine.filter((l) => l.stage === 'lost').length
      return {
        user,
        total: mine.length,
        won,
        lost,
        open: mine.length - won - lost,
        rate: mine.length ? pct(won, mine.length) : 0,
        closedRate: won + lost ? pct(won, won + lost) : null,
      }
    })
    .sort((a, b) => b.rate - a.rate || b.won - a.won || b.total - a.total)
}
