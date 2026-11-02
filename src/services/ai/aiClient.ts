/**
 * AI service interface (rule-based MOCK).
 *
 * SECURITY: never put provider API keys in the frontend. Anything bundled by Vite is
 * public. Real calls MUST go through a backend proxy (see VITE_AI_PROXY_URL in
 * .env.example) which holds the keys, enforces auth/rate limits and talks to the provider.
 * When the proxy exists, replace `run` with:
 *   fetch(env.aiProxyUrl, { method: 'POST', body: JSON.stringify({ task, input }) })
 * The input/output types below are the contract the proxy must honour.
 */
import {
  draftWhatsAppMessage,
  recommendProducts,
  scoreLead,
  suggestNextAction,
} from './engines/leadInsights'
import { parseLeadFromText } from './engines/parseLead'
import { explainAlternative } from './engines/stockInsights'
import { atRiskLeads, chatWithCRM, dailyBriefing } from './engines/teamInsights'
import type { AiTask } from './tasks'
import type {
  AtRiskInput,
  AtRiskOutput,
  BriefingOutput,
  ChatInput,
  ChatOutput,
  DraftInput,
  DraftOutput,
  ExplainInput,
  ExplainOutput,
  LeadCtx,
  NextActionOutput,
  ParsedLead,
  ParseLeadInput,
  RecommendOutput,
  ScoreOutput,
  TeamCtx,
} from './types'

export interface AiInputs {
  scoreLead: LeadCtx
  summarizeLead: LeadCtx
  suggestNextAction: LeadCtx
  draftWhatsAppMessage: DraftInput
  draftQuotation: LeadCtx
  parseLeadFromText: ParseLeadInput
  recommendProducts: LeadCtx
  chatWithCRM: ChatInput
  dailyBriefing: TeamCtx
  atRiskLeads: AtRiskInput
  explainAlternative: ExplainInput
}
export interface AiOutputs {
  scoreLead: ScoreOutput
  summarizeLead: { summary: string }
  suggestNextAction: NextActionOutput
  draftWhatsAppMessage: DraftOutput
  draftQuotation: { notes: string }
  parseLeadFromText: ParsedLead
  recommendProducts: RecommendOutput
  chatWithCRM: ChatOutput
  dailyBriefing: BriefingOutput
  atRiskLeads: AtRiskOutput
  explainAlternative: ExplainOutput
}

export interface AskResult<T = unknown> {
  task: AiTask
  output: T
  meta: { provider: 'mock'; latencyMs: number }
}

type Runner = { [K in AiTask]: (input: AiInputs[K]) => AiOutputs[K] }
const RUNNERS: Runner = {
  scoreLead,
  suggestNextAction,
  draftWhatsAppMessage,
  recommendProducts,
  parseLeadFromText,
  chatWithCRM,
  dailyBriefing,
  atRiskLeads,
  explainAlternative,
  // Planned, not implemented yet:
  summarizeLead: () => ({ summary: '' }),
  draftQuotation: () => ({ notes: '' }),
}

export async function ask<T extends AiTask>({
  task,
  input,
}: {
  task: T
  input: AiInputs[T]
}): Promise<AskResult<AiOutputs[T]>> {
  const latencyMs = 600 + Math.round(Math.random() * 900)
  await new Promise((r) => setTimeout(r, latencyMs))
  const output = (RUNNERS[task] as (i: AiInputs[T]) => AiOutputs[T])(input)
  return { task, output, meta: { provider: 'mock', latencyMs } }
}
