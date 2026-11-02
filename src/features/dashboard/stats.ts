import { LEAD_SOURCES, type LostReasonId, type SourceId } from '@/constants'
import { bucketOf } from '@/features/leads/followUps'
import { isUntouched } from '@/features/leads/sla'
import { startOfDayIST } from '@/lib/dates'
import type { Lead, User } from '@/types'

export interface OwnerStats {
  todayBySource: { id: SourceId; count: number }[]
  todayTotal: number
  untouched: Lead[]
  overduePerStaff: { user: User; count: number }[]
  conversion: { id: SourceId; total: number; won: number; rate: number }[]
  avgResponseMin: number | null
  lostReasons: { id: LostReasonId; count: number }[]
  leaderboard: { user: User; won: number; open: number }[]
}

export function buildOwnerStats(leads: Lead[], users: User[], now: number): OwnerStats {
  const start = startOfDayIST(now)
  const staff = users.filter((u) => u.role === 'staff')
  const today = leads.filter((l) => Date.parse(l.createdAt) >= start)
  const resp = leads
    .filter((l) => l.firstContactedAt && now - Date.parse(l.createdAt) <= 7 * 86_400_000)
    .map((l) => (Date.parse(l.firstContactedAt!) - Date.parse(l.createdAt)) / 60_000)
    .filter((m) => m >= 0)
    .sort((a, b) => a - b)
  const lost = new Map<LostReasonId, number>()
  for (const l of leads)
    if (l.stage === 'lost' && l.lostReason)
      lost.set(l.lostReason, (lost.get(l.lostReason) ?? 0) + 1)
  return {
    todayBySource: LEAD_SOURCES.map((s) => ({
      id: s.id,
      count: today.filter((l) => l.source === s.id).length,
    })),
    todayTotal: today.length,
    untouched: leads.filter(isUntouched),
    overduePerStaff: staff.map((user) => ({
      user,
      count: leads.filter((l) => l.assignedTo === user.id && bucketOf(l, now) === 'overdue').length,
    })),
    conversion: LEAD_SOURCES.map((s) => {
      const mine = leads.filter((l) => l.source === s.id)
      const won = mine.filter((l) => l.stage === 'won').length
      return {
        id: s.id,
        total: mine.length,
        won,
        rate: mine.length ? Math.round((won / mine.length) * 100) : 0,
      }
    }),
    avgResponseMin: resp.length ? resp[Math.floor(resp.length / 2)] : null,
    lostReasons: [...lost.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
    leaderboard: staff
      .map((user) => ({
        user,
        won: leads.filter((l) => l.assignedTo === user.id && l.stage === 'won').length,
        open: leads.filter(
          (l) => l.assignedTo === user.id && l.stage !== 'won' && l.stage !== 'lost',
        ).length,
      }))
      .sort((a, b) => b.won - a.won),
  }
}
