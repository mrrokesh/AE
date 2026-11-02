import type { SourceId, Temperature } from '@/constants'
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

export type WaKindId = 'followUp' | 'offer' | 'visit' | 'thanks'
export interface DraftInput extends LeadCtx {
  kind: WaKindId
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
