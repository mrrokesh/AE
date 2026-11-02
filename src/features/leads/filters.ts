import type { Temperature } from '@/constants'
import { scoreLeadRaw } from '@/services/ai'
import type { Lead, Product } from '@/types'
import { bucketOf, type Bucket } from './followUps'
import { leadName } from './format'
import { isUntouched } from './sla'

export interface ScoredLead {
  lead: Lead
  temperature: Temperature
  score: number
  closed: boolean
}

export interface LeadFilters {
  q: string
  stage: string
  source: string
  assignee: string // user id | 'unassigned'
  product: string
  temp: string
  from: string // yyyy-mm-dd (IST)
  to: string
  bucket: string // overdue | today | upcoming
  untouched: boolean
}

export const EMPTY_FILTERS: LeadFilters = {
  q: '',
  stage: '',
  source: '',
  assignee: '',
  product: '',
  temp: '',
  from: '',
  to: '',
  bucket: '',
  untouched: false,
}

export function filtersFromParams(sp: URLSearchParams): LeadFilters {
  const f = { ...EMPTY_FILTERS }
  for (const k of Object.keys(f) as (keyof LeadFilters)[]) {
    const v = sp.get(k)
    if (v === null) continue
    if (k === 'untouched') f.untouched = v === '1'
    else (f[k] as string) = v
  }
  return f
}

export function filtersToParams(f: LeadFilters): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(f)) if (v) out[k] = v === true ? '1' : String(v)
  return out
}

export const activeFilterCount = (f: LeadFilters) =>
  Object.values(f).filter(Boolean).length - (f.q ? 1 : 0)

export function scoreAll(leads: Lead[], now: number): ScoredLead[] {
  return leads.map((lead) => {
    const s = scoreLeadRaw(lead, now)
    return { lead, temperature: s.temperature, score: s.score, closed: s.closed }
  })
}

export function filterLeads(
  rows: ScoredLead[],
  f: LeadFilters,
  products: Product[],
  now: number,
): ScoredLead[] {
  const q = f.q.trim().toLowerCase()
  const qDigits = q.replace(/\D/g, '')
  const from = f.from ? Date.parse(`${f.from}T00:00:00+05:30`) : null
  const to = f.to ? Date.parse(`${f.to}T23:59:59.999+05:30`) : null
  return rows.filter(({ lead, temperature }) => {
    if (f.stage && lead.stage !== f.stage) return false
    if (f.source && lead.source !== f.source) return false
    if (f.assignee) {
      const unassigned = f.assignee === 'unassigned'
      if (unassigned ? lead.assignedTo !== null : lead.assignedTo !== f.assignee) return false
    }
    if (f.product && !lead.productInterest.includes(f.product)) return false
    if (f.temp && temperature !== f.temp) return false
    const created = Date.parse(lead.createdAt)
    if (from !== null && created < from) return false
    if (to !== null && created > to) return false
    if (f.bucket && bucketOf(lead, now) !== (f.bucket as Bucket)) return false
    if (f.untouched && !isUntouched(lead)) return false
    if (q) {
      const names = lead.productInterest
        .map((id) => products.find((p) => p.id === id)?.name ?? '')
        .join(' ')
      const hay = `${leadName(lead)} ${lead.city} ${lead.email} ${names}`.toLowerCase()
      if (!hay.includes(q) && !(qDigits.length >= 3 && lead.phone.includes(qDigits))) return false
    }
    return true
  })
}
