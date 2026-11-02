import { isOpenStage } from '@/constants'
import { bucketOf } from '@/features/leads/followUps'
import { isUntouched } from '@/features/leads/sla'
import { stockDemand } from '@/features/products/demand'
import { endOfDayIST } from '@/lib/dates'
import type {
  AtRiskInput,
  AtRiskOutput,
  BriefingOutput,
  ChatInput,
  ChatOutput,
  TeamCtx,
} from '../types'
import { scoreLeadRaw } from './scoring'
import { DAY, firstProduct, istHour, nm, tr } from './shared'

export function dailyBriefing({
  leads,
  users,
  products,
  now,
  lang,
  slaMinutes,
}: TeamCtx): BriefingOutput {
  const open = leads.filter((l) => isOpenStage(l.stage))
  const overdue = open.filter((l) => bucketOf(l, now) === 'overdue').length
  const hotToday = open.filter(
    (l) =>
      scoreLeadRaw(l, now).temperature === 'hot' &&
      (l.stage === 'negotiation' || l.stage === 'store_visit' || bucketOf(l, now) === 'today'),
  ).length
  const late = open.filter(
    (l) => isUntouched(l) && (now - Date.parse(l.createdAt)) / 60000 >= slaMinutes,
  )
  const byStaff = new Map<string, number>()
  for (const l of late)
    if (l.assignedTo) byStaff.set(l.assignedTo, (byStaff.get(l.assignedTo) ?? 0) + 1)
  const worst = [...byStaff.entries()].sort((a, b) => b[1] - a[1])[0]
  const h = istHour(now)
  const parts = [
    tr(
      lang,
      h < 12 ? 'ai.briefing.morning' : h < 17 ? 'ai.briefing.afternoon' : 'ai.briefing.evening',
    ),
  ]
  if (overdue) parts.push(tr(lang, 'ai.briefing.overdue', { count: overdue }))
  if (hotToday) parts.push(tr(lang, 'ai.briefing.hot', { count: hotToday }))
  if (late.length) parts.push(tr(lang, 'ai.briefing.untouched', { count: late.length }))
  const top = stockDemand(leads, products, now).sort((a, b) => b.weekCount - a.weekCount)[0]
  if (top && top.weekCount > 0)
    parts.push(tr(lang, 'ai.briefing.restock', { product: top.product.name, count: top.weekCount }))
  if (worst)
    parts.push(
      tr(lang, 'ai.briefing.staff', {
        name: users.find((u) => u.id === worst[0])?.name.split(' ')[0] ?? '',
        count: worst[1],
      }),
    )
  if (parts.length === 1) parts.push(tr(lang, 'ai.briefing.allClear'))
  return { text: parts.join(' '), stats: { overdue, hot: hotToday, untouched: late.length } }
}

export function atRiskLeads({ leads, now, lang, days }: AtRiskInput): AtRiskOutput {
  const items = leads
    .filter((l) => isOpenStage(l.stage) && l.lastContactedAt)
    .map((l) => ({
      l,
      d: Math.floor((now - Date.parse(l.lastContactedAt!)) / DAY),
      s: scoreLeadRaw(l, now),
    }))
    .filter((x) => x.d >= days && x.s.temperature !== 'cold')
    .sort((a, b) => b.s.score - a.s.score)
    .slice(0, 8)
    .map(({ l, d, s }) => ({
      leadId: l.id,
      name: nm(l),
      days: d,
      label: s.temperature,
      reason: tr(lang, 'ai.risk.reason', {
        days: d,
        label: tr(lang, `temperature.${s.temperature}`),
      }),
    }))
  return { items }
}

const has = (q: string, words: string[]) => words.some((w) => q.includes(w))
const link = (id: string, name: string) => `[[lead:${id}|${name}]]`

/** Answers CRM questions from local data. Understands English, Tamil and Tanglish keywords. */
export function chatWithCRM({
  question,
  leads,
  users,
  products,
  now,
  lang,
  slaMinutes,
}: ChatInput): ChatOutput {
  const q = question.toLowerCase()
  const open = leads.filter((l) => isOpenStage(l.stage))
  const today = has(q, ['today', 'இன்று', 'இன்னைக்கு', 'innaiku', 'indru'])
  const week = has(q, ['week', 'வாரம்', 'vaaram'])
  const count = has(q, ['how many', 'count', 'எத்தனை', 'evlo', 'evvalavu', 'ethana'])
  const list = (rows: typeof leads) =>
    rows
      .slice(0, 8)
      .map((l) => `• ${link(l.id, nm(l))} · ${firstProduct(l, products)?.name ?? '—'}`)
      .join('\n')
  const answer = (
    key: string,
    rows: typeof leads,
    extra?: Record<string, unknown>,
  ): ChatOutput => ({
    reply:
      rows.length === 0
        ? tr(lang, `${key}_none`, extra)
        : `${tr(lang, key, { count: rows.length, ...extra })}${count && !has(q, ['show', 'list', 'kaatu', 'காட்டு']) ? '' : '\n' + list(rows)}`,
    leadIds: rows.slice(0, 8).map((l) => l.id),
  })

  const staff = users.find(
    (u) => u.role === 'staff' && q.includes(u.name.split(' ')[0].toLowerCase()),
  )
  if (staff) {
    const mine = open.filter((l) => l.assignedTo === staff.id)
    const od = mine.filter((l) => bucketOf(l, now) === 'overdue')
    return answer('ai.chat.staff', od.length ? od : mine, {
      name: staff.name.split(' ')[0],
      open: mine.length,
      overdue: od.length,
    })
  }
  if (has(q, ['hot', 'ஹாட்', 'சூடான', 'hot leads'])) {
    const hot = open.filter(
      (l) =>
        scoreLeadRaw(l, now).temperature === 'hot' && (!today || bucketOf(l, now) !== 'upcoming'),
    )
    return answer(today ? 'ai.chat.hotToday' : 'ai.chat.hot', hot)
  }
  if (has(q, ['overdue', 'missed', 'miss', 'தவறி', 'thavari', 'late']))
    return answer(
      'ai.chat.overdue',
      open
        .filter((l) => bucketOf(l, now) === 'overdue')
        .sort((a, b) => Date.parse(a.nextFollowUpAt!) - Date.parse(b.nextFollowUpAt!)),
    )
  if (has(q, ['untouched', 'not contacted', 'no contact', 'contact pannala', 'பேசாத', 'பேசல']))
    return answer(
      'ai.chat.untouched',
      open.filter((l) => isUntouched(l)),
      { sla: slaMinutes },
    )
  if (has(q, ['unassigned', 'inbox', 'யாருக்கும்', 'oruthar kitta illa']))
    return answer(
      'ai.chat.unassigned',
      open.filter((l) => l.assignedTo === null),
    )
  if (has(q, ['website', 'வெப்சைட்', 'web '])) {
    const from = week ? endOfDayIST(now) - 7 * DAY : today ? endOfDayIST(now) - DAY : 0
    return answer(
      week ? 'ai.chat.websiteWeek' : today ? 'ai.chat.websiteToday' : 'ai.chat.website',
      leads.filter((l) => l.source === 'website' && Date.parse(l.createdAt) >= from),
    )
  }
  if (has(q, ['won', 'sold', 'closed', 'வாங்கின', 'vangina']))
    return answer(
      'ai.chat.won',
      leads.filter((l) => l.stage === 'won'),
    )
  if (has(q, ['lost', 'போன', 'vangala']))
    return answer(
      'ai.chat.lost',
      leads.filter((l) => l.stage === 'lost'),
    )
  if (has(q, ['follow', 'ஃபாலோ', 'followup', 'call']))
    return answer(
      'ai.chat.followToday',
      open.filter((l) => bucketOf(l, now) === 'today'),
    )
  return { reply: tr(lang, 'ai.chat.help'), leadIds: [] }
}
