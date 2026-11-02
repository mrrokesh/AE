import { endOfDayIST, startOfDayIST } from '@/lib/dates'
import type { Lead, User } from '@/types'
import { bucketOf } from '@/features/leads/followUps'
import { isUntouched } from '@/features/leads/sla'

export interface StaffDay {
  user: User
  calls: number
  whatsapps: number
  visits: number
  won: Lead[]
  /** Follow-ups whose time passed and are still open, plus untouched leads. */
  missed: Lead[]
  /** Everything still pending that rolls over to tomorrow: missed + still due today. */
  carryOver: Lead[]
  tomorrow: number
}

/** End-of-day picture per staff member, derived from lead activities. */
export function buildDayReport(leads: Lead[], users: User[], now: number): StaffDay[] {
  const start = startOfDayIST(now)
  const tomorrowEnd = endOfDayIST(now) + 86_400_000
  return users
    .filter((u) => u.role === 'staff')
    .map((user) => {
      const mine = leads.filter((l) => l.assignedTo === user.id)
      let calls = 0,
        whatsapps = 0,
        visits = 0
      const won: Lead[] = []
      for (const l of leads)
        for (const a of l.activities) {
          if (a.by !== user.id || Date.parse(a.at) < start || a.key?.startsWith('act.enquiry'))
            continue
          if (a.type === 'call') calls++
          else if (a.type === 'whatsapp') whatsapps++
          else if (a.type === 'visit') visits++
          if (a.key === 'act.won' || (a.key === 'act.stageChange' && a.params?.stage === 'won'))
            won.push(l)
        }
      const missed = mine.filter((l) => bucketOf(l, now) === 'overdue' || isUntouched(l))
      const pendingToday = mine.filter((l) => bucketOf(l, now) === 'today')
      const tomorrow = mine.filter(
        (l) =>
          l.nextFollowUpAt &&
          bucketOf(l, now) === 'upcoming' &&
          Date.parse(l.nextFollowUpAt) < tomorrowEnd,
      ).length
      return {
        user,
        calls,
        whatsapps,
        visits,
        won: [...new Set(won)],
        missed,
        carryOver: [...missed, ...pendingToday],
        tomorrow,
      }
    })
}
