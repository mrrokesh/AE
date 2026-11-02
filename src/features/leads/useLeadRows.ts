import { useMemo } from 'react'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { useNow } from '@/store/clockStore'
import { scoreAll } from './filters'

/** Role-scoped leads with their Hot/Warm/Cold score, refreshed as time passes. */
export function useScoredLeads() {
  const leads = useScopedLeads()
  const now = useNow()
  return useMemo(() => scoreAll(leads, now), [leads, now])
}
