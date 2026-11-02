import { useMemo } from 'react'
import { isOpenStage } from '@/constants'
import type { Lead } from '@/types'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser, useScopedLeads } from '@/features/auth/useCurrentUser'
import { bucketOf } from '@/features/leads/followUps'
import { isUntouched } from '@/features/leads/sla'
import { useNow } from '@/store/clockStore'
import { useSettingsStore } from '@/store/settingsStore'

export type NotificationKind = 'restock' | 'escalation' | 'enquiry' | 'overdue'
export interface AppNotification {
  id: string
  kind: NotificationKind
  leadId: string
  at: number
}

/** Time of an unactioned "back in stock" entry from the last 24h (cleared once the customer is contacted). */
function latestBackInStock(l: Lead, now: number): number | null {
  const at = Math.max(
    0,
    ...l.activities.filter((a) => a.key === 'act.backInStock').map((a) => Date.parse(a.at)),
  )
  const touched = l.lastContactedAt ? Date.parse(l.lastContactedAt) : 0
  return at && now - at < 86_400_000 && touched < at && isOpenStage(l.stage) ? at : null
}

/** Derived (not stored): escalations, unclaimed enquiries and overdue follow-ups for the signed-in user. */
export function useNotifications(): AppNotification[] {
  const leads = useScopedLeads()
  const user = useCurrentUser()
  const now = useNow()
  const escalationMinutes = useSettingsStore((s) => s.escalationMinutes)
  return useMemo(() => {
    const out: AppNotification[] = []
    for (const l of leads) {
      const age = (now - Date.parse(l.createdAt)) / 60_000
      if (
        isUntouched(l) &&
        age >= escalationMinutes &&
        (isOwner(user) || l.assignedTo === user?.id)
      )
        out.push({
          id: `esc-${l.id}`,
          kind: 'escalation',
          leadId: l.id,
          at: Date.parse(l.createdAt),
        })
      else if (l.assignedTo === null && isUntouched(l))
        out.push({ id: `enq-${l.id}`, kind: 'enquiry', leadId: l.id, at: Date.parse(l.createdAt) })
      const mine = isOwner(user) || l.assignedTo === user?.id
      const back = mine ? latestBackInStock(l, now) : null
      if (back) out.push({ id: `rs-${l.id}`, kind: 'restock', leadId: l.id, at: back })
      else if (bucketOf(l, now) === 'overdue' && mine)
        out.push({
          id: `od-${l.id}`,
          kind: 'overdue',
          leadId: l.id,
          at: Date.parse(l.nextFollowUpAt ?? ''),
        })
    }
    const order: Record<NotificationKind, number> = {
      restock: 0,
      escalation: 1,
      enquiry: 2,
      overdue: 3,
    }
    return out.sort((a, b) => order[a.kind] - order[b.kind] || a.at - b.at)
  }, [leads, user, now, escalationMinutes])
}
