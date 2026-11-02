import { isOpenStage } from '@/constants'
import { newAct, save } from '@/features/leads/actions'
import type { Lead, Product, User } from '@/types'
import { joinWaitlist } from './waitlist'

/** Out-of-stock products a lead is interested in (only while the lead is still open). */
export const oosInterest = (lead: Lead, products: Product[]): Product[] =>
  isOpenStage(lead.stage)
    ? lead.productInterest
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => !!p && p.stockStatus === 'out_of_stock')
    : []

/** Adds the in-stock alternative to the lead (the original stays, so the waitlist and demand stats still count it). */
export async function addAlternative(
  lead: Lead,
  original: Product,
  alternative: Product,
  user: User,
): Promise<Lead> {
  if (lead.productInterest.includes(alternative.id)) return lead
  return save(lead.id, {
    productInterest: [...lead.productInterest, alternative.id],
    activities: [
      ...lead.activities,
      newAct({
        type: 'system',
        key: 'act.alternativeAdded',
        params: {
          fromId: original.id,
          toId: alternative.id,
          from: original.name,
          to: alternative.name,
        },
        by: user.id,
      }),
    ],
  })
}

/** Waitlists the lead for every out-of-stock product it wants. Returns the updated lead. */
export async function waitlistAll(lead: Lead, products: Product[], user: User): Promise<Lead> {
  let current = lead
  for (const p of oosInterest(lead, products)) current = await joinWaitlist(lead.id, p, user)
  return current
}
