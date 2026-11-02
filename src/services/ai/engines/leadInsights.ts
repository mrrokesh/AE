import { isOpenStage } from '@/constants'
import { formatINR } from '@/lib/format'
import { bucketOf } from '@/features/leads/followUps'
import { isUntouched } from '@/features/leads/sla'
import type {
  DraftInput,
  DraftOutput,
  LeadCtx,
  NextActionOutput,
  RecommendOutput,
  ScoreOutput,
} from '../types'
import { scoreLeadRaw } from './scoring'
import { DAY, firstProduct, istHour, nm, tr } from './shared'

export function scoreLead({ lead, now, lang }: LeadCtx): ScoreOutput {
  const raw = scoreLeadRaw(lead, now)
  const top = [...raw.reasons].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, 3)
  return {
    score: raw.score,
    label: raw.closed ? 'closed' : raw.temperature,
    reasons: top.map((r) => tr(lang, r.key, { ...r.params, count: r.params?.count })),
  }
}

function hourLabel(h: number) {
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`
}

export function suggestNextAction({ lead, products, now, lang }: LeadCtx): NextActionOutput {
  const p = firstProduct(lead, products)?.name ?? tr(lang, 'wa.yourEnquiry')
  const lastKey = [...lead.activities]
    .reverse()
    .find((a) => a.type !== 'system' && a.type !== 'stage_change' && a.key)?.key
  const lastNoAnswerHour =
    lastKey === 'act.noAnswer'
      ? istHour(
          Date.parse([...lead.activities].reverse().find((a) => a.key === 'act.noAnswer')!.at),
        )
      : null
  const spokeHours = lead.activities
    .filter((a) => a.key === 'act.spoke')
    .map((a) => istHour(Date.parse(a.at)))
    .sort((a, b) => a - b)
  const hasPrice = lead.activities.some((a) => a.key === 'act.priceAsked')
  const ageMin = Math.round((now - Date.parse(lead.createdAt)) / 60000)

  const timeKey = (): string => {
    if (!isOpenStage(lead.stage)) return tr(lang, 'ai.bestTime.none')
    if (isUntouched(lead) || bucketOf(lead, now) === 'overdue') return tr(lang, 'ai.bestTime.now')
    if (lastNoAnswerHour !== null)
      return tr(lang, lastNoAnswerHour < 14 ? 'ai.bestTime.evening' : 'ai.bestTime.tomorrowMorning')
    if (spokeHours.length)
      return tr(lang, 'ai.bestTime.around', {
        time: hourLabel(spokeHours[Math.floor(spokeHours.length / 2)]),
      })
    return tr(lang, istHour(now) < 11 ? 'ai.bestTime.midday' : 'ai.bestTime.evening')
  }

  let key = 'ai.next.followUp'
  let channel: NextActionOutput['channel'] = 'whatsapp'
  if (!isOpenStage(lead.stage)) {
    key = 'ai.next.closed'
    channel = 'call'
  } else if (isUntouched(lead)) {
    key = 'ai.next.untouched'
    channel = 'call'
  } else if (lastKey === 'act.noAnswer') {
    key = 'ai.next.noAnswer'
    channel = 'whatsapp'
  } else if (lead.stage === 'negotiation') {
    key = 'ai.next.negotiation'
    channel = 'call'
  } else if (lead.stage === 'store_visit') {
    key = 'ai.next.afterVisit'
    channel = 'call'
  } else if (bucketOf(lead, now) === 'overdue') {
    key = 'ai.next.overdue'
    channel = 'call'
  } else if (hasPrice) {
    key = 'ai.next.sendQuote'
    channel = 'whatsapp'
  } else if (lead.stage === 'interested') {
    key = 'ai.next.invite'
    channel = 'visit'
  }
  return {
    action: tr(lang, key, {
      product: p,
      name: nm(lead),
      time: `${ageMin}m`,
      days: Math.max(
        1,
        Math.round((now - Date.parse(lead.lastContactedAt ?? lead.createdAt)) / DAY),
      ),
    }),
    channel,
    bestTime: timeKey(),
  }
}

export function draftWhatsAppMessage({
  lead,
  products,
  staffName,
  lang,
  kind,
}: DraftInput): DraftOutput {
  const p = firstProduct(lead, products)
  return {
    message: tr(lang, `wa.${kind}`, {
      name: nm(lead).split(' ')[0],
      staff: staffName.split(' ')[0],
      product: p?.name ?? tr(lang, 'wa.yourEnquiry'),
      price: p ? formatINR(p.sellingPrice) : '',
      mrp: p ? formatINR(p.mrp) : '',
    }),
  }
}

export function recommendProducts({ lead, products, lang }: LeadCtx): RecommendOutput {
  const chosen = lead.productInterest
    .map((id) => products.find((p) => p.id === id))
    .filter((p) => !!p)
  const cats = [...new Set(chosen.map((p) => p!.category))]
  const budget = lead.budget
  const out: RecommendOutput['items'] = []
  const push = (productId: string, reason: string) =>
    !out.some((o) => o.productId === productId) &&
    !lead.productInterest.includes(productId) &&
    out.push({ productId, reason })

  for (const cat of cats) {
    const pool = products.filter((p) => p.category === cat && !lead.productInterest.includes(p.id))
    const fit = budget
      ? pool
          .filter((p) => p.sellingPrice <= budget * 1.1)
          .sort((a, b) => b.sellingPrice - a.sellingPrice)
      : pool
    fit
      .slice(0, 2)
      .forEach((p) =>
        push(
          p.id,
          budget
            ? tr(lang, 'ai.rec.fitsBudget', { budget: formatINR(budget) })
            : tr(lang, 'ai.rec.alternative'),
        ),
      )
  }
  if (out.length < 3) {
    const pool = products.filter((p) => p.category === 'speaker' || p.category === 'thermal')
    const fit = budget ? pool.filter((p) => p.sellingPrice <= budget) : pool
    fit
      .sort((a, b) => b.sellingPrice - a.sellingPrice)
      .slice(0, 3)
      .forEach((p) => push(p.id, tr(lang, 'ai.rec.popular')))
  }
  return { items: out.slice(0, 4) }
}
