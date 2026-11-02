/** Labels live in the locale files under `stages.<id>`. */
export const LEAD_STAGES = [
  { id: 'new', tone: 'neutral' },
  { id: 'contacted', tone: 'info' },
  { id: 'interested', tone: 'violet' },
  { id: 'store_visit', tone: 'warning' },
  { id: 'negotiation', tone: 'brand' },
  { id: 'won', tone: 'success' },
  { id: 'lost', tone: 'danger' },
] as const

export type StageId = (typeof LEAD_STAGES)[number]['id']
export type Tone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'violet'

export const STAGE_BY_ID = Object.fromEntries(LEAD_STAGES.map((s) => [s.id, s])) as Record<
  StageId,
  (typeof LEAD_STAGES)[number]
>

export const OPEN_STAGES: StageId[] = [
  'new',
  'contacted',
  'interested',
  'store_visit',
  'negotiation',
]
export const isOpenStage = (s: StageId) => s !== 'won' && s !== 'lost'

/** Labels: `lostReasons.<id>` */
export const LOST_REASONS = [
  { id: 'price' },
  { id: 'bought_elsewhere' },
  { id: 'not_reachable' },
  { id: 'changed_mind' },
  { id: 'out_of_stock' },
  { id: 'other' },
] as const
export type LostReasonId = (typeof LOST_REASONS)[number]['id']
