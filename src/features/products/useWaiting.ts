import { useMemo } from 'react'
import { isOpenStage } from '@/constants'
import { useScopedLeads } from '@/features/auth/useCurrentUser'

/** productId -> number of open leads (visible to the current user) that want it. */
export function useWaitingCounts(): Map<string, number> {
  const leads = useScopedLeads()
  return useMemo(() => {
    const m = new Map<string, number>()
    for (const l of leads)
      if (isOpenStage(l.stage))
        for (const id of new Set(l.productInterest)) m.set(id, (m.get(id) ?? 0) + 1)
    return m
  }, [leads])
}
