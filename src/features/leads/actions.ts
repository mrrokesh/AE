import type { LostReasonId, SourceId, StageId } from '@/constants'
import { isOpenStage } from '@/constants'
import { tomorrowAt11 } from '@/lib/dates'
import { generateId } from '@/lib/id'
import { leadsApi } from '@/services/api'
import { useCrmStore } from '@/store/crmStore'
import type { Activity, Lead, User } from '@/types'

/** All lead writes go through here: API call first, then the client cache is updated. */

const crm = () => useCrmStore.getState()
export const newAct = (a: Omit<Activity, 'id' | 'at'> & { at?: string }): Activity => ({
  id: generateId('a'),
  at: new Date().toISOString(),
  ...a,
})

export class NextActionRequiredError extends Error {
  constructor() {
    super('NEXT_ACTION_REQUIRED')
    this.name = 'NextActionRequiredError'
  }
}

export async function save(id: string, patch: Partial<Lead>): Promise<Lead> {
  const lead = await leadsApi.update(id, patch)
  crm().applyLead(lead)
  return lead
}
export const getLead = (id: string): Lead => {
  const lead = crm().leads.find((l) => l.id === id)
  if (!lead) throw new Error(`Lead ${id} not found`)
  return lead
}

export interface NewLeadInput {
  name: string
  phone: string // normalized 10 digits
  source: SourceId
  productInterest: string[]
  note?: string
  followUpAt: string // required: no lead without a next action
  city?: string
  quantity?: number
  budget?: number | null
  urgent?: boolean
  /** Original pasted/enquiry text. */
  message?: string
}

export async function createLead(
  input: NewLeadInput,
  user: User,
  opts: { assignToSelf?: boolean; touched?: boolean } = {},
): Promise<Lead> {
  if (!input.followUpAt) throw new NextActionRequiredError()
  const { products } = crm()
  const first = products.find((p) => p.id === input.productInterest[0])
  const now = new Date().toISOString()
  const staffCaptured = opts.touched ?? true
  const acts: Activity[] = [
    newAct({
      type:
        input.source === 'walk_in'
          ? 'visit'
          : input.source === 'whatsapp'
            ? 'whatsapp'
            : input.source === 'website'
              ? 'system'
              : 'call',
      key: `act.enquiry.${input.source}`,
      params: { product: first?.name ?? '—' },
      by: user.id,
      text: input.message,
    }),
  ]
  if (input.note?.trim()) acts.push(newAct({ type: 'note', by: user.id, text: input.note.trim() }))
  const lead = await leadsApi.create({
    name: input.name.trim(),
    businessName: '',
    phone: input.phone,
    email: '',
    city: input.city ?? '',
    source: input.source,
    productInterest: input.productInterest,
    quantity: input.quantity ?? 1,
    budget: input.budget ?? null,
    stage: 'new',
    assignedTo: opts.assignToSelf === false || user.role === 'owner' ? null : user.id,
    nextFollowUpAt: input.followUpAt,
    firstContactedAt: staffCaptured ? now : null,
    lastContactedAt: staffCaptured ? now : null,
    lostReason: null,
    activities: acts,
    tags: input.urgent ? ['urgent'] : [],
    waitlist: [],
  })
  crm().applyLead(lead)
  return lead
}

export type NextAction =
  { kind: 'followUp'; at: string } | { kind: 'won' } | { kind: 'lost'; reason: LostReasonId }

export interface LogActivityInput {
  leadId: string
  type: 'call' | 'whatsapp' | 'visit' | 'note'
  outcomeKey?: string
  text?: string
  next: NextAction | null
  stage?: StageId
}

/**
 * Logs a call / WhatsApp / visit / note. REQUIRES a next action: a future follow-up date,
 * or closing the lead as Won/Lost. Enforced here as well as in the form.
 */
export async function logActivity(input: LogActivityInput, user: User): Promise<Lead> {
  const { next } = input
  if (!next || (next.kind === 'followUp' && !(Date.parse(next.at) > Date.now() - 60_000)))
    throw new NextActionRequiredError()
  const lead = getLead(input.leadId)
  const now = new Date().toISOString()
  const acts: Activity[] = [
    newAct({
      type: input.type,
      key: input.outcomeKey,
      text: input.text?.trim() || undefined,
      by: user.id,
    }),
  ]
  const patch: Partial<Lead> = {}
  const contact = input.type !== 'note'
  if (contact) {
    patch.lastContactedAt = now
    patch.firstContactedAt = lead.firstContactedAt ?? now
  }
  if (lead.assignedTo === null) {
    patch.assignedTo = user.id
    acts.push(
      newAct({ type: 'system', key: 'act.claimed', params: { name: user.name }, by: user.id }),
    )
  }
  let stage: StageId = input.stage ?? lead.stage
  if (next.kind === 'won') stage = 'won'
  else if (next.kind === 'lost') stage = 'lost'
  else if (stage === 'new' && contact) stage = 'contacted'
  if (stage !== lead.stage)
    acts.push(
      newAct({ type: 'stage_change', key: 'act.stageChange', params: { stage }, by: user.id }),
    )
  patch.stage = stage
  patch.nextFollowUpAt = next.kind === 'followUp' ? next.at : null
  patch.lostReason = next.kind === 'lost' ? next.reason : stage === 'lost' ? lead.lostReason : null
  patch.activities = [...lead.activities, ...acts]
  return save(lead.id, patch)
}

export async function changeStage(
  leadId: string,
  stage: StageId,
  user: User,
  lostReason?: LostReasonId,
): Promise<Lead> {
  const lead = getLead(leadId)
  if (stage === lead.stage) return lead
  if (stage === 'lost' && !lostReason) throw new Error('LOST_REASON_REQUIRED')
  const acts = [
    newAct({ type: 'stage_change', key: 'act.stageChange', params: { stage }, by: user.id }),
  ]
  const patch: Partial<Lead> = { stage, lostReason: stage === 'lost' ? (lostReason ?? null) : null }
  if (!isOpenStage(stage)) patch.nextFollowUpAt = null
  else if (!lead.nextFollowUpAt) patch.nextFollowUpAt = tomorrowAt11().toISOString()
  patch.activities = [...lead.activities, ...acts]
  return save(leadId, patch)
}

export async function claimLead(leadId: string, user: User): Promise<Lead> {
  const lead = getLead(leadId)
  const acts = [
    newAct({ type: 'system', key: 'act.claimed', params: { name: user.name }, by: user.id }),
  ]
  return save(leadId, { assignedTo: user.id, activities: [...lead.activities, ...acts] })
}

export async function assignLead(leadId: string, assignee: User, by: User): Promise<Lead> {
  const lead = getLead(leadId)
  const acts = [
    newAct({ type: 'system', key: 'act.assigned', params: { name: assignee.name }, by: by.id }),
  ]
  return save(leadId, { assignedTo: assignee.id, activities: [...lead.activities, ...acts] })
}

export async function reschedule(leadId: string, at: string, user: User): Promise<Lead> {
  if (!(Date.parse(at) > Date.now() - 60_000)) throw new NextActionRequiredError()
  const lead = getLead(leadId)
  const acts = [newAct({ type: 'system', key: 'act.rescheduled', by: user.id })]
  return save(leadId, { nextFollowUpAt: at, activities: [...lead.activities, ...acts] })
}

export async function bulkAssign(ids: string[], assignee: User, by: User): Promise<void> {
  for (const id of ids) await assignLead(id, assignee, by)
}

export async function bulkStage(
  ids: string[],
  stage: StageId,
  user: User,
  lostReason?: LostReasonId,
): Promise<void> {
  for (const id of ids) await changeStage(id, stage, user, lostReason)
}
