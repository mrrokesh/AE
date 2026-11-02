import { useMemo } from 'react'
import { isOpenStage } from '@/constants'
import { useCrmStore } from '@/store/crmStore'

/** Open leads nobody owns yet, oldest first (most urgent on top). */
export function useUnassigned() {
  const leads = useCrmStore((s) => s.leads)
  return useMemo(
    () =>
      leads
        .filter((l) => l.assignedTo === null && isOpenStage(l.stage))
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    [leads],
  )
}
