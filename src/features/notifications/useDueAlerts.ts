import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { leadName } from '@/features/leads/format'
import { playChime } from '@/lib/sound'
import { showNotification } from '@/lib/notify'
import { useClockStore } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import { toast } from '@/store/toastStore'

/**
 * Fires a toast + chime + browser notification when a follow-up assigned to the user
 * comes due while the app is open. Follow-ups already overdue at load are not re-announced.
 */
export function useDueAlerts(active: boolean) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!active || !user) return
    const check = () => {
      const now = Date.now()
      const due = useCrmStore
        .getState()
        .leads.filter(
          (l) =>
            l.nextFollowUpAt &&
            Date.parse(l.nextFollowUpAt) <= now &&
            l.assignedTo === user.id &&
            l.stage !== 'won' &&
            l.stage !== 'lost',
        )
      const key = (id: string, at: string | null) => `${id}@${at}`
      if (!seen.current) {
        seen.current = new Set(due.map((l) => key(l.id, l.nextFollowUpAt)))
        return
      }
      for (const l of due) {
        const k = key(l.id, l.nextFollowUpAt)
        if (seen.current.has(k)) continue
        seen.current.add(k)
        const title = t('bell.followUpDue')
        const body = `${leadName(l)} · ${t('bell.callNow')}`
        toast.info(title, body)
        playChime()
        showNotification(title, body, k)
      }
    }
    check()
    return useClockStore.subscribe(check)
  }, [active, user, t])
}
