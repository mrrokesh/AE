import { useMemo } from 'react'
import { scoreLeadRaw } from '@/services/ai'
import { useNow } from '@/store/clockStore'
import type { Lead } from '@/types'

export const temperatureOf = (lead: Lead, now: number) => scoreLeadRaw(lead, now).temperature

/** Hot/warm/cold for a lead, recomputed as time passes. */
export function useTemperature(lead: Lead) {
  const now = useNow()
  return useMemo(() => scoreLeadRaw(lead, now), [lead, now])
}
