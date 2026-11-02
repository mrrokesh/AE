import { isOpenStage } from '@/constants'
import { endOfDayIST } from '@/lib/dates'
import type { Lead } from '@/types'

export type Bucket = 'overdue' | 'today' | 'upcoming'

/** overdue = due time already passed; today = due later today; upcoming = after today. */
export function bucketOf(lead: Lead, now: number): Bucket | null {
  if (!lead.nextFollowUpAt || !isOpenStage(lead.stage)) return null
  const due = Date.parse(lead.nextFollowUpAt)
  if (due < now) return 'overdue'
  return due < endOfDayIST(now) ? 'today' : 'upcoming'
}

export const byDue = (a: Lead, b: Lead) =>
  Date.parse(a.nextFollowUpAt ?? '') - Date.parse(b.nextFollowUpAt ?? '')

export function groupFollowUps(leads: Lead[], now: number): Record<Bucket, Lead[]> {
  const out: Record<Bucket, Lead[]> = { overdue: [], today: [], upcoming: [] }
  for (const l of leads) {
    const b = bucketOf(l, now)
    if (b) out[b].push(l)
  }
  for (const k of Object.keys(out) as Bucket[]) out[k].sort(byDue)
  return out
}
