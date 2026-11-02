import { isOpenStage } from '@/constants'
import type { Lead } from '@/types'

export type SlaLevel = 'none' | 'ok' | 'breached' | 'escalated'

export interface SlaState {
  level: SlaLevel
  /** Minutes since the lead arrived. */
  ageMin: number
  /** Minutes until the SLA is breached (negative once breached). */
  remainingMin: number
}

/** A lead is "untouched" until someone logs a first call/WhatsApp/visit. */
export const isUntouched = (lead: Lead) => isOpenStage(lead.stage) && !lead.firstContactedAt

export function slaState(lead: Lead, now: number, slaMin: number, escalationMin: number): SlaState {
  const ageMin = (now - Date.parse(lead.createdAt)) / 60_000
  if (!isUntouched(lead)) return { level: 'none', ageMin, remainingMin: 0 }
  const level: SlaLevel =
    ageMin >= escalationMin ? 'escalated' : ageMin >= slaMin ? 'breached' : 'ok'
  return { level, ageMin, remainingMin: slaMin - ageMin }
}

export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min))
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}
