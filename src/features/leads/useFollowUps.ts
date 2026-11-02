import { useMemo } from 'react'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { useNow } from '@/store/clockStore'
import type { Activity, Lead } from '@/types'
import { groupFollowUps } from './followUps'

const DAY = 86_400_000

/** Touches logged in the last 7 days (the "Done" tab), newest first. */
export function recentTouches(leads: Lead[], now: number): { lead: Lead; activity: Activity }[] {
  const out: { lead: Lead; activity: Activity }[] = []
  for (const lead of leads)
    for (const activity of lead.activities)
      if (
        (activity.type === 'call' || activity.type === 'whatsapp' || activity.type === 'visit') &&
        !activity.key?.startsWith('act.enquiry') &&
        now - Date.parse(activity.at) < 7 * DAY
      )
        out.push({ lead, activity })
  return out.sort((a, b) => Date.parse(b.activity.at) - Date.parse(a.activity.at))
}

export function useFollowUps(assigneeId: string) {
  const scoped = useScopedLeads()
  const now = useNow()
  return useMemo(() => {
    const leads = assigneeId ? scoped.filter((l) => l.assignedTo === assigneeId) : scoped
    return { groups: groupFollowUps(leads, now), done: recentTouches(leads, now) }
  }, [scoped, now, assigneeId])
}
