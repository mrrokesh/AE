export const AI_TASKS = {
  scoreLead: 'scoreLead',
  summarizeLead: 'summarizeLead',
  suggestNextAction: 'suggestNextAction',
  draftWhatsAppMessage: 'draftWhatsAppMessage',
  draftQuotation: 'draftQuotation',
  /** Paste a WhatsApp message, get lead fields back. */
  parseLeadFromText: 'parseLeadFromText',
  recommendProducts: 'recommendProducts',
  chatWithCRM: 'chatWithCRM',
  dailyBriefing: 'dailyBriefing',
  atRiskLeads: 'atRiskLeads',
} as const

export type AiTask = (typeof AI_TASKS)[keyof typeof AI_TASKS]
