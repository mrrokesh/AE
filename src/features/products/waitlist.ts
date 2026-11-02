import { isOpenStage } from '@/constants'
import { getLead, newAct, save } from '@/features/leads/actions'
import { startOfDayIST } from '@/lib/dates'
import { useCrmStore } from '@/store/crmStore'
import type { Lead, Product, User } from '@/types'

const DAY = 86_400_000
const IST = 5.5 * 3_600_000
const isoDateIST = (t: number) => new Date(t + IST).toISOString().slice(0, 10)

/** 11:00 IST on the restock date, or 7 days from now when the date is unknown or already past. */
export function restockFollowUp(product: Product, now = Date.now()): { at: string; date: string } {
  const eta = product.restockEta
  const etaMs = eta ? Date.parse(`${eta}T11:00:00+05:30`) : NaN
  if (etaMs > now) return { at: new Date(etaMs).toISOString(), date: eta! }
  const t = startOfDayIST(now + 7 * DAY) + 11 * 3_600_000
  return { at: new Date(t).toISOString(), date: isoDateIST(t) }
}

/** Customers waiting for a product: open leads on its waitlist. */
export const waitingLeads = (leads: Lead[], productId: string) =>
  leads.filter((l) => isOpenStage(l.stage) && l.waitlist.includes(productId))

/** Adds the lead to the product's waitlist and makes sure a follow-up exists around the restock date. */
export async function joinWaitlist(leadId: string, product: Product, user: User): Promise<Lead> {
  const lead = getLead(leadId)
  if (lead.waitlist.includes(product.id)) return lead
  const now = Date.now()
  const f = restockFollowUp(product, now)
  const existing = lead.nextFollowUpAt ? Date.parse(lead.nextFollowUpAt) : null
  const keepExisting = existing !== null && existing > now && existing < Date.parse(f.at)
  return save(leadId, {
    waitlist: [...lead.waitlist, product.id],
    nextFollowUpAt: keepExisting ? lead.nextFollowUpAt : f.at,
    activities: [
      ...lead.activities,
      newAct({
        type: 'system',
        key: 'act.waitlistJoined',
        params: { product: product.name, date: product.restockEta ?? f.date },
        by: user.id,
      }),
    ],
  })
}

/**
 * Product is back: every waiting lead gets a "call now" follow-up due today and a timeline entry
 * (the assigned staff see it in their bell and Follow-ups). Returns how many customers were waiting.
 */
export async function notifyRestock(product: Product, by: User): Promise<number> {
  const waiting = waitingLeads(useCrmStore.getState().leads, product.id)
  const due = new Date(Date.now() + 2 * 60_000).toISOString()
  for (const l of waiting)
    await save(l.id, {
      waitlist: l.waitlist.filter((id) => id !== product.id),
      nextFollowUpAt: due,
      activities: [
        ...l.activities,
        newAct({
          type: 'system',
          key: 'act.backInStock',
          params: { product: product.name },
          by: by.id,
        }),
      ],
    })
  return waiting.length
}
