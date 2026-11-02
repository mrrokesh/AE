import { isOpenStage, type StageId, type Temperature } from '@/constants'
import type { Lead } from '@/types'

const DAY = 86_400_000

export interface Reason {
  /** Locale key under `ai.reason.*` */
  key: string
  params?: Record<string, string | number>
  /** Contribution to the score (negative = hurts). */
  weight: number
}

export interface RawScore {
  score: number
  temperature: Temperature
  closed: boolean
  reasons: Reason[]
}

const STAGE_WEIGHT: Record<StageId, number> = {
  new: 0,
  contacted: 6,
  interested: 16,
  store_visit: 26,
  negotiation: 34,
  won: 0,
  lost: 0,
}
const HOT = 65
const WARM = 40

/** Deterministic, explainable lead score. The mock "AI" and the Hot/Warm/Cold filters share this. */
export function scoreLeadRaw(lead: Lead, now: number): RawScore {
  const closed = !isOpenStage(lead.stage)
  let score = 20
  const reasons: Reason[] = []
  const add = (key: string, weight: number, params?: Reason['params']) => {
    score += weight
    reasons.push({ key, weight, params })
  }

  if (STAGE_WEIGHT[lead.stage] > 0) add(`ai.reason.stage.${lead.stage}`, STAGE_WEIGHT[lead.stage])
  const asks = Math.min(2, lead.activities.filter((a) => a.key === 'act.priceAsked').length)
  if (asks > 0) add('ai.reason.priceAsked', asks * 8, { count: asks })
  if (lead.activities.some((a) => a.key === 'act.visitedStore')) add('ai.reason.visitedStore', 10)
  if (lead.quantity >= 3) add('ai.reason.bulk', 8, { count: lead.quantity })
  if (lead.tags.includes('urgent')) add('ai.reason.urgent', 8)
  if (lead.source === 'walk_in') add('ai.reason.walkIn', 4)

  if (lead.lastContactedAt) {
    const days = (now - Date.parse(lead.lastContactedAt)) / DAY
    if (days <= 2) add('ai.reason.recentContact', 8)
    else if (days >= 4)
      add('ai.reason.noReply', -Math.min(25, Math.round((days - 3) * 5)), {
        days: Math.floor(days),
      })
  } else if (now - Date.parse(lead.createdAt) > 3_600_000) {
    add('ai.reason.untouched', -6)
  }
  if (lead.nextFollowUpAt && now - Date.parse(lead.nextFollowUpAt) > DAY)
    add('ai.reason.followUpOverdue', -6)

  score = Math.max(0, Math.min(100, score))
  const temperature: Temperature = score >= HOT ? 'hot' : score >= WARM ? 'warm' : 'cold'
  return { score, temperature, closed, reasons }
}
