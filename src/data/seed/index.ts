import type { Activity, Customer, Lead, Product, User } from '@/types'
import type { LostReasonId, SourceId, StageId } from '@/constants'
import { LOST_REASONS } from '@/constants'
import { startOfDayIST } from '@/lib/dates'
import accessories from './accessories.json'
import computers from './computers.json'
import printerSpeakerProducts from './products.json'
import users from './users.json'
import { LEAD_ROWS } from './leadRows'

export interface SeedData {
  users: User[]
  products: Product[]
  leads: Lead[]
  customers: Customer[]
}

/** Printers/speakers come from the importer; computers and accessories are hand-maintained demo stock. */
const products = [...printerSpeakerProducts, ...computers, ...accessories]

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const STAFF = ['u_2', 'u_3', 'u_4']
const STAGE_ORDER: StageId[] = [
  'new',
  'contacted',
  'interested',
  'store_visit',
  'negotiation',
  'won',
]

const MESSAGES = {
  en: (p: string) => `Hi, I would like to know the price of ${p}. Please call me.`,
  ta: 'விலை சொல்லுங்க, வாட்ஸ்அப்ல அனுப்புங்க',
  tanglish: 'Rate enna sir? Shop evlo time varaikum open?',
}

/**
 * Builds demo data with every date RELATIVE to `now`, so a fresh reset always shows
 * overdue, due-today, untouched (SLA-breached) and at-risk leads.
 */
export function buildSeed(now = Date.now()): SeedData {
  let s = 7
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
  const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
  const iso = (t: number) => new Date(t).toISOString()
  const prod = Object.fromEntries((products as unknown as Product[]).map((p) => [p.id, p]))
  const startToday = startOfDayIST(now)
  const endToday = startToday + DAY

  const leads: Lead[] = LEAD_ROWS.split('\n').map((line, i) => {
    const [name, city, source, pids, qty, stage, scenario, flagStr] = line.split('|')
    const flags = (flagStr ?? '').split(',').filter(Boolean)
    const productInterest = pids.split(',')
    const quantity = Number(qty)
    const first = prod[productInterest[0]]
    const untouched = scenario === 'fresh' || scenario === 'red' || scenario === 'esc'
    const closed = stage === 'won' || stage === 'lost'
    const staffId = STAFF[i % 3]

    let createdAt: number
    if (scenario === 'fresh') createdAt = now - int(2, 11) * MIN
    else if (scenario === 'red') createdAt = now - int(20, 50) * MIN
    else if (scenario === 'esc') createdAt = now - int(75, 240) * MIN
    else if (scenario === 'wontoday') createdAt = now - int(6, 20) * DAY
    else createdAt = now - int(closed ? 6 : 3, closed ? 40 : 16) * DAY - int(0, 8) * HOUR

    const unassigned = untouched && (source === 'website' || scenario === 'fresh')
    const assignedTo = unassigned ? null : staffId
    const by = assignedTo ?? 'u_1'

    // Last meaningful touch (not for untouched leads)
    let lastContact: number | null = null
    if (!untouched) {
      if (scenario === 'atrisk') lastContact = now - int(5, 8) * DAY
      else if (scenario === 'wontoday') lastContact = now - int(1, 4) * HOUR
      else if (closed) lastContact = now - int(1, 15) * DAY
      else if (flags.includes('touched'))
        lastContact = Math.max(startToday + 5 * MIN, now - int(25, 150) * MIN)
      else lastContact = now - int(1, 4) * DAY - int(0, 6) * HOUR
      lastContact = Math.max(lastContact, createdAt + 20 * MIN)
    }

    // Follow-up
    let next: number | null = null
    if (untouched) next = createdAt + 15 * MIN
    else if (scenario === 'overdue') {
      const d = [0, 1, 1, 2, 3, 5][int(0, 5)]
      next = d === 0 ? now - int(60, 240) * MIN : startToday - d * DAY + int(10, 18) * HOUR
    } else if (scenario === 'atrisk') next = startToday - int(1, 3) * DAY + 11 * HOUR
    else if (scenario === 'today')
      next = Math.min(Math.max(now + int(20, 480) * MIN, now + 5 * MIN), endToday - 15 * MIN)
    else if (scenario === 'soon') next = now + 4 * MIN
    else if (scenario === 'upcoming')
      next = startToday + int(1, 6) * DAY + (rnd() < 0.5 ? 11 : 17) * HOUR

    // Activities
    const acts: Omit<Activity, 'id'>[] = []
    const enquiry: Omit<Activity, 'id'> = {
      type:
        source === 'walk_in'
          ? 'visit'
          : source === 'website'
            ? 'system'
            : source === 'whatsapp'
              ? 'whatsapp'
              : 'call',
      key: `act.enquiry.${source}`,
      params: { product: first.name },
      at: iso(createdAt),
      by: source === 'website' ? 'u_1' : by,
    }
    if (source === 'website') enquiry.text = MESSAGES.en(first.name)
    else if (flags.includes('ta')) enquiry.text = MESSAGES.ta
    else if (flags.includes('tanglish')) enquiry.text = MESSAGES.tanglish
    acts.push(enquiry)

    const idx = STAGE_ORDER.indexOf(stage === 'lost' ? 'negotiation' : (stage as StageId))
    if (!untouched && lastContact) {
      const span = lastContact - createdAt
      const steps: Omit<Activity, 'id' | 'at'>[] = []
      const push = (type: Activity['type'], key: string, params?: Activity['params']) =>
        steps.push({ type, key, params, by })
      if (idx >= 1) push('call', 'act.spoke')
      if (flags.includes('noans')) push('call', 'act.noAnswer')
      if (flags.includes('price2')) {
        push('whatsapp', 'act.priceAsked')
        push('call', 'act.priceAsked')
      } else if (idx >= 2) push('whatsapp', 'act.sentPrices')
      if (flags.includes('visit') || idx >= 3) push('visit', 'act.visitedStore')
      if (idx >= 4) push('call', 'act.negotiating')
      if (stage === 'won') push('call', 'act.won')
      if (stage === 'lost') push('call', 'act.lost')
      steps.forEach((st, k) =>
        acts.push({ ...st, at: iso(createdAt + (span * (k + 1)) / steps.length) }),
      )
    }
    if (flags.includes('touched') && lastContact) {
      acts.push({ type: 'call', key: 'act.spoke', by, at: iso(lastContact) })
    }

    const lostReason: LostReasonId | null =
      stage === 'lost' ? LOST_REASONS[i % LOST_REASONS.length].id : null
    const base = productInterest.reduce((t, pid) => t + prod[pid].sellingPrice * quantity, 0)
    const budget = i % 5 === 0 ? null : Math.round((base * (0.9 + rnd() * 0.2)) / 500) * 500
    const sorted = acts
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((a, k) => ({ ...a, id: `l_${i + 1}_a${k + 1}` }))
    const touches = sorted
      .filter((a) => a.type === 'call' || a.type === 'whatsapp' || a.type === 'visit')
      .filter((a) => a.key !== `act.enquiry.${source}`)
    const firstTouch = touches[0]?.at ?? null

    return {
      id: `l_${String(i + 1).padStart(2, '0')}`,
      name,
      businessName: '',
      phone: '9' + String(int(100000000, 999999999)),
      email: source === 'website' ? `${name.split(' ')[0].toLowerCase()}@gmail.com` : '',
      city,
      source: source as SourceId,
      productInterest,
      quantity,
      budget,
      stage: stage as StageId,
      assignedTo,
      nextFollowUpAt: closed || next === null ? null : iso(next),
      firstContactedAt: firstTouch,
      lastContactedAt: touches.length ? touches[touches.length - 1].at : null,
      lostReason,
      activities: sorted,
      waitlist: [],
      tags: [
        ...(flags.includes('urgent') ? ['urgent'] : []),
        ...(flags.includes('bulk') || quantity >= 3 ? ['bulk'] : []),
      ],
      createdAt: iso(createdAt),
      updatedAt: sorted[sorted.length - 1].at,
    }
  })

  // Demo story: some customers already asked to be told when their out-of-stock product returns.
  const WAITING: Record<string, string> = {
    'Ramesh Babu': 'p5634',
    'Roja Devi': 'p5634',
    'Nandhini M': 'p5437',
  }
  for (const l of leads) {
    const pid = WAITING[l.name]
    if (!pid || !prod[pid]) continue
    l.waitlist = [pid]
    l.activities.push({
      id: `a_wl_${l.id}`,
      type: 'system',
      at: iso(now - 3 * 3_600_000),
      by: l.assignedTo ?? STAFF[0],
      key: 'act.waitlistJoined',
      params: { product: prod[pid].name, date: prod[pid].restockEta ?? '' },
    })
    l.activities.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
  }

  const customers: Customer[] = leads
    .filter((l) => l.stage === 'won')
    .map((l, i) => {
      const items = l.productInterest.map((pid) => ({
        productId: pid,
        name: prod[pid].name,
        qty: l.quantity,
        unitPrice: prod[pid].sellingPrice,
      }))
      const total = items.reduce((t, it) => t + it.qty * it.unitPrice, 0)
      return {
        id: `c_${String(i + 1).padStart(2, '0')}`,
        leadId: l.id,
        name: l.name,
        businessName: '',
        phone: l.phone,
        email: l.email,
        city: l.city,
        tags: l.tags,
        purchases: [
          {
            id: `pu_${i + 1}`,
            invoiceNo: `AE/26-27/${String(101 + i * 7).padStart(4, '0')}`,
            date: l.updatedAt,
            items,
            total,
          },
        ],
        totalSpent: total,
        createdAt: l.updatedAt,
        updatedAt: l.updatedAt,
      }
    })

  return {
    users: users as unknown as User[],
    products: products as unknown as Product[],
    leads,
    customers,
  }
}
