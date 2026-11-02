import type { SourceId } from '@/constants'
import type { Product } from '@/types'
import type { ParseLeadInput, ParsedLead } from '../types'

const LOCALITIES = [
  'Fairlands',
  'Hasthampatti',
  'Suramangalam',
  'Ammapet',
  'Shevapet',
  'Five Roads',
  'Junction',
  'Kondalampatti',
  'Alagapuram',
  'Gugai',
  'Kitchipalayam',
  'Meyyanur',
  'Neimandi',
  'Cherry Road',
  'Sooramangalam',
  'Fort',
  'Attur',
  'Omalur',
  'Mettur',
  'Namakkal',
  'Erode',
  'Edappadi',
  'Rasipuram',
]
const TA_LOCALITIES: Record<string, string> = {
  சேலம்: 'Salem',
  அம்மாபேட்டை: 'Ammapet',
  அஸ்தம்பட்டி: 'Hasthampatti',
  சூரமங்கலம்: 'Suramangalam',
  ஃபேர்லேண்ட்ஸ்: 'Fairlands',
  ஆத்தூர்: 'Attur',
  ஓமலூர்: 'Omalur',
  மேட்டூர்: 'Mettur',
}

/** Keyword -> product category, across English, Tanglish and Tamil. */
const CATEGORY_WORDS: Record<string, string[]> = {
  thermal: [
    'thermal',
    'billing',
    'bill printer',
    'bill machine',
    'receipt',
    'pos printer',
    'bill print',
    'பில்லிங்',
    'தெர்மல்',
    'பில் பிரிண்டர்',
    'பில் மெஷின்',
  ],
  label: ['label', 'sticker', 'barcode', 'லேபிள்', 'ஸ்டிக்கர்', 'பார்கோடு'],
  dot_matrix: [
    'dot matrix',
    'dotmatrix',
    'dot-matrix',
    'invoice printer',
    'multi copy',
    'carbon copy',
    'டாட் மேட்ரிக்ஸ்',
  ],
  laser: ['laser', 'லேசர்'],
  ink_tank: [
    'ink tank',
    'inktank',
    'ink-tank',
    'colour print',
    'color print',
    'xerox',
    'இங்க் டேங்க்',
    'கலர் பிரிண்ட்',
  ],
  speaker: [
    'speaker',
    'spekar',
    'soundbar',
    'sound bar',
    'party speaker',
    'dj',
    'paatu',
    'bluetooth',
    'ஸ்பீக்கர்',
    'சவுண்ட்',
    'பாட்டு',
  ],
}
const BRAND_WORDS: Record<string, string> = {
  jbl: 'JBL',
  zebronics: 'Zebronics',
  zeb: 'Zebronics',
  tvs: 'TVS Electronics',
  hp: 'HP',
  epson: 'Epson',
  canon: 'Canon',
  brother: 'Brother',
  fingers: 'Fingers',
  portronics: 'Portronics',
  ஜேபிஎல்: 'JBL',
  ஜெப்ரானிக்ஸ்: 'Zebronics',
}
const TA_NUM: Record<string, number> = {
  ஒண்ணு: 1,
  ஒன்று: 1,
  ரெண்டு: 2,
  இரண்டு: 2,
  மூணு: 3,
  மூன்று: 3,
  நாலு: 4,
  நான்கு: 4,
  அஞ்சு: 5,
  ஐந்து: 5,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  rendu: 2,
  moonu: 3,
  naalu: 4,
}
const URGENT = [
  'urgent',
  'immediately',
  'asap',
  'today itself',
  'right now',
  'quick',
  'இன்னைக்கே',
  'உடனே',
  'அவசரம்',
  'udane',
  'avasaram',
  'innaikke',
  'ippove',
]
const TANGLISH = [
  'venum',
  'vendum',
  'enna',
  'evlo',
  'evvalavu',
  'irukku',
  'irukka',
  'sir',
  'anna',
  'pannunga',
  'solunga',
  'kudunga',
  'rate',
  'vilai',
  'epdi',
  'ennoda',
  'naan',
  'nan ',
  'ungal',
  'kadai',
  'vanga',
  'varen',
  'paaka',
]

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u200b\u200c]/g, '')
    .replace(/\s+/g, ' ')

function detect(text: string): ParsedLead['detected'] {
  const tamil = (text.match(/[஀-௿]/g) ?? []).length
  if (tamil / Math.max(1, text.replace(/\s/g, '').length) > 0.2) return 'ta'
  const low = ` ${norm(text)} `
  return TANGLISH.filter((w) => low.includes(w)).length >= 2 ? 'tanglish' : 'en'
}

function findPhone(text: string): string {
  const m = text.match(/(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}/)
  if (!m) return ''
  return m[0].replace(/\D/g, '').slice(-10)
}

function cleanName(raw: string): string {
  const cut = raw.split(
    /\b(?:from|here|and|ku|kitta|calling|speaking|requirement|need|want)\b|[,.;\n\d]|பேசுறேன்|இருந்து/i,
  )[0]
  return cut
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .slice(0, 3)
    .map((w) => (/[A-Za-z]/.test(w) ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

function findName(text: string): string {
  const patterns = [
    /(?:my name is|i am|i'm|this is|name\s*[:-])\s*([A-Za-z][A-Za-z .]{1,30})/i,
    /(?:naan|nan|en peru|ennoda peru|peru)\s+([A-Za-z][A-Za-z .]{1,25})/i,
    /(?:என் பெயர்|என் பேரு|என்னோட பேரு|நான்|பெயர்)\s*[:-]?\s*([஀-௿][஀-௿ ]{1,25})/,
    /^\[?[^\]\n]{0,25}\]?\s*-?\s*([A-Za-z][A-Za-z ]{1,25}):/m,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      const n = cleanName(m[1])
      if (n.length >= 2) return n
    }
  }
  return ''
}

function findBudget(text: string): number | null {
  const low = norm(text)
  const m =
    low.match(
      /(?:budget|bajet|பட்ஜெட்|under|within|max|upto|up to|₹|rs\.?|rupees?|ரூபாய்)\s*[:-]?\s*₹?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|l\b|ஆயிரம்|aayiram|ayiram|இலட்சம்|லட்சம்)?/i,
    ) ?? low.match(/(\d[\d,]*(?:\.\d+)?)\s*(k\b|ஆயிரம்|aayiram|ayiram|லட்சம்|lakh)/i)
  if (!m) return null
  let n = Number(m[1].replace(/,/g, ''))
  const unit = (m[2] ?? '').toLowerCase()
  if (['k', 'ஆயிரம்', 'aayiram', 'ayiram'].includes(unit)) n *= 1000
  else if (['lakh', 'l', 'இலட்சம்', 'லட்சம்'].includes(unit)) n *= 100000
  return n >= 500 ? Math.round(n) : null
}

function findQuantity(text: string): number | null {
  const low = norm(text)
  const m = low.match(
    /(\d+)\s*(?:nos?\b|pcs|pieces?|units?|numbers?|printers?|speakers?|எண்|பீஸ்)/i,
  )
  if (m) return Math.min(99, Number(m[1]))
  for (const [w, n] of Object.entries(TA_NUM))
    if (
      new RegExp(`(?:^|\\s)${w}\\s*(?:printer|speaker|nos|பிரிண்டர்|ஸ்பீக்கர்|பீஸ்)`, 'i').test(low)
    )
      return n
  return null
}

/** Model codes taken from the catalog itself, e.g. "RP 3230" -> "rp3230", "Flip 7" -> "flip7". */
const squash = (v: string) => norm(v).replace(/[\s-]+/g, '')
function modelTokens(name: string): string[] {
  return (norm(name).match(/[a-z]+[\s-]?\d+[a-z]*/g) ?? []).map(squash).filter((t) => t.length >= 3)
}

function matchProducts(text: string, products: Product[]): string[] {
  const low = norm(text)
  const flat = squash(text)
  const direct = products
    .map((p) => ({ p, hit: modelTokens(p.name).filter((t) => flat.includes(t)) }))
    .filter((x) => x.hit.length)
    .sort(
      (a, b) => Math.max(...b.hit.map((t) => t.length)) - Math.max(...a.hit.map((t) => t.length)),
    )
    .map((x) => x.p)
  if (direct.length) return direct.slice(0, 2).map((p) => p.id)
  const brand = Object.entries(BRAND_WORDS).find(([w]) => low.includes(w))?.[1]
  const cat = Object.entries(CATEGORY_WORDS).find(([, words]) =>
    words.some((w) => low.includes(w)),
  )?.[0]
  let pool = products
  if (cat) pool = pool.filter((p) => p.category === cat)
  if (brand) pool = pool.filter((p) => p.brand === brand)
  if (!cat && !brand) return []
  return pool.slice(0, 2).map((p) => p.id)
}

function findSource(text: string): SourceId {
  const low = norm(text)
  if (/\b(called|call note|phone call|missed call)\b|கால் பண்ணி|போன் பண்ணி/.test(low))
    return 'phone'
  if (/\b(walk-?in|visited|came to (?:the )?shop|came to store)\b|கடைக்கு வந்த|நேரில்/.test(low))
    return 'walk_in'
  return 'whatsapp'
}

/** Rule-based parser for pasted WhatsApp messages / call notes in English, Tamil and Tanglish. */
export function parseLeadFromText({ text, products }: ParseLeadInput): ParsedLead {
  const phone = findPhone(text)
  const name = findName(text)
  const productIds = matchProducts(text, products)
  const budget = findBudget(text)
  const low = norm(text)
  const city =
    LOCALITIES.find((l) => low.includes(l.toLowerCase())) ??
    Object.entries(TA_LOCALITIES).find(([ta]) => text.includes(ta))?.[1] ??
    ''
  const found = [name, phone, productIds.length ? 'x' : '', budget ? 'x' : ''].filter(
    Boolean,
  ).length
  return {
    name,
    phone,
    city,
    source: findSource(text),
    productIds,
    quantity: findQuantity(text),
    budget,
    urgent: URGENT.some((w) => low.includes(w)),
    detected: detect(text),
    confidence: found / 4,
    notes: text.trim(),
  }
}
