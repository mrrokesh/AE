import type { SourceId, Temperature } from '@/constants'
import type { Alternative } from '@/features/products/similarity'
import type { Lead, Product, User } from '@/types'

export type Lang = 'en' | 'ta'

export interface ParseLeadInput {
  text: string
  products: Product[]
  lang: Lang
}

export interface ParsedLead {
  name: string
  phone: string
  city: string
  source: SourceId
  productIds: string[]
  quantity: number | null
  budget: number | null
  urgent: boolean
  detected: 'en' | 'ta' | 'tanglish'
  /** 0..1: share of key fields (name, phone, product, budget) that were found. */
  confidence: number
  notes: string
}

/** Everything the lead-level tasks need. */
export interface LeadCtx {
  lead: Lead
  products: Product[]
  users: User[]
  staffName: string
  now: number
  lang: Lang
}

export interface ScoreOutput {
  score: number
  label: Temperature | 'closed'
  reasons: string[]
}

export interface NextActionOutput {
  action: string
  channel: 'call' | 'whatsapp' | 'visit'
  bestTime: string
}

export type WaKindId = 'followUp' | 'offer' | 'visit' | 'thanks' | 'out_of_stock_alternative'
export interface DraftInput extends LeadCtx {
  kind: WaKindId
  /** Required for 'out_of_stock_alternative'. */
  stock?: { original: Product; alternative: Alternative }
}

export interface ExplainInput {
  original: Product
  alternative: Alternative
  budget: number | null
  lang: Lang
}
export interface ExplainOutput {
  text: string
}
export interface DraftOutput {
  message: string
}

export interface RecommendOutput {
  items: { productId: string; reason: string }[]
}

export interface TeamCtx {
  leads: Lead[]
  users: User[]
  products: Product[]
  now: number
  lang: Lang
  slaMinutes: number
}

export interface BriefingOutput {
  text: string
  stats: { overdue: number; hot: number; untouched: number }
}

export interface AtRiskItem {
  leadId: string
  name: string
  days: number
  label: Temperature
  reason: string
}
export interface AtRiskInput extends TeamCtx {
  days: number
}
export interface AtRiskOutput {
  items: AtRiskItem[]
}

export interface ChatInput extends TeamCtx {
  question: string
}
export interface ChatOutput {
  /** Text with `[[lead:ID|Name]]` markers the UI turns into links. */
  reply: string
  leadIds: string[]
}
