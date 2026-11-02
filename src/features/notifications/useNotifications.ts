import { useMemo } from 'react'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser, useScopedLeads } from '@/features/auth/useCurrentUser'
import { bucketOf } from '@/features/leads/followUps'
import { isUntouched } from '@/features/leads/sla'
import { useNow } from '@/store/clockStore'
import { useSettingsStore } from '@/store/settingsStore'

export type NotificationKind = 'escalation' | 'enquiry' | 'overdue'
export interface AppNotification {
  id: string
  kind: NotificationKind
  leadId: string
  at: number
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
      if (bucketOf(l, now) === 'overdue' && (isOwner(user) || l.assignedTo === user?.id))
        out.push({
          id: `od-${l.id}`,
          kind: 'overdue',
          leadId: l.id,
          at: Date.parse(l.nextFollowUpAt ?? ''),
        })
    }
    const order: Record<NotificationKind, number> = { escalation: 0, enquiry: 1, overdue: 2 }
    return out.sort((a, b) => order[a.kind] - order[b.kind] || a.at - b.at)
  }, [leads, user, now, escalationMinutes])
}
