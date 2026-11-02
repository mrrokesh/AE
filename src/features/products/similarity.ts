import { formatINR } from '@/lib/format'
import type { CategoryId } from '@/constants'
import type { Product, ProductSpecs } from '@/types'

/** A translatable fact. `key` is looked up under `catalog.sim.*`; params are pre-formatted. */
export interface SimReason {
  key: string
  params?: Record<string, string | number>
  /** good = clearly in the customer's favour, bad = a trade-off, neutral = just different. */
  tone: 'good' | 'bad' | 'neutral'
}

export interface Alternative {
  product: Product
  /** 0-100 overall closeness. */
  score: number
  /** 0-1: how much of the comparison was based on known specs (null specs lower this). */
  confidence: number
  matches: SimReason[]
  differences: SimReason[]
  /** alternative.sellingPrice - original.sellingPrice (negative = cheaper). */
  priceDelta: number
}

// Max points: specs 70 (normalised over the specs known on BOTH products), price 25, brand 5.
const SPEC_POINTS = 70
const PRICE_POINTS = 25
const BRAND_POINTS = 5
const NEUTRAL_SPEC = 0.5 // used when no spec is comparable: neither rewarded nor punished
const OFF_TYPE_PENALTY = 15

const PRINTER_WEIGHTS = {
  printWidth: 20,
  connectivity: 15,
  speed: 12,
  resolution: 8,
  autoCutter: 8,
  color: 10,
} as const
const SPEAKER_WEIGHTS = { watts: 22, batteryHours: 12, waterproof: 12, connectivity: 16 } as const

/** Used only when a category has too few in-stock products of its own. */
const RELATED: Partial<Record<CategoryId, CategoryId[]>> = {
  thermal: ['label'],
  label: ['thermal'],
  dot_matrix: ['thermal'],
  photo: ['ink_tank'],
  cartridge: ['photo', 'ink_tank'],
  ink_tank: ['photo'],
}

interface Cmp {
  weight: number
  /** 0-1 */
  sim: number
  match?: SimReason
  diff?: SimReason
}

const dpiOf = (r: string | null) => (r ? Number(r.match(/\d+/)?.[0]) || null : null)
const money = (n: number) => formatINR(Math.abs(Math.round(n)))

function compareSpecs(a: ProductSpecs, b: ProductSpecs, speaker: boolean): Cmp[] {
  const out: Cmp[] = []
  const w: Record<string, number> = speaker ? SPEAKER_WEIGHTS : PRINTER_WEIGHTS

  if (!speaker && a.printWidth && b.printWidth) {
    const same = a.printWidth === b.printWidth
    out.push({
      weight: w.printWidth,
      sim: same ? 1 : 0,
      match: same ? { key: 'sameWidth', params: { v: b.printWidth }, tone: 'good' } : undefined,
      diff: same
        ? undefined
        : { key: 'diffWidth', params: { alt: b.printWidth, orig: a.printWidth }, tone: 'bad' },
    })
  }
  if (a.connectivity && b.connectivity) {
    const shared = a.connectivity.filter((c) => b.connectivity!.includes(c))
    const extra = b.connectivity.filter((c) => !a.connectivity!.includes(c))
    const lacks = a.connectivity.filter((c) => !b.connectivity!.includes(c))
    out.push({
      weight: w.connectivity,
      sim: a.connectivity.length ? shared.length / a.connectivity.length : 1,
      match: shared.length
        ? { key: 'alsoConn', params: { v: shared.join(' + ') }, tone: 'good' }
        : undefined,
      diff: lacks.length
        ? { key: 'lacksConn', params: { v: lacks.join(' + ') }, tone: 'bad' }
        : extra.length
          ? { key: 'extraConn', params: { v: extra.join(' + ') }, tone: 'good' }
          : undefined,
    })
  }
  if (!speaker && a.speed && b.speed && a.speed.unit === b.speed.unit) {
    const ratio = b.speed.value / a.speed.value
    const p = { alt: b.speed.value, orig: a.speed.value, unit: a.speed.unit }
    out.push({
      weight: w.speed,
      sim: Math.min(1, ratio),
      match:
        ratio >= 0.95 && ratio <= 1.05 ? { key: 'sameSpeed', params: p, tone: 'good' } : undefined,
      diff:
        ratio < 0.95
          ? { key: 'slower', params: p, tone: 'bad' }
          : ratio > 1.05
            ? { key: 'faster', params: p, tone: 'good' }
            : undefined,
    })
  }
  const ra = dpiOf(a.resolution)
  const rb = dpiOf(b.resolution)
  if (!speaker && ra && rb) {
    out.push({
      weight: w.resolution,
      sim: Math.min(1, rb / ra),
      match:
        rb >= ra ? { key: 'resolutionOk', params: { v: b.resolution! }, tone: 'good' } : undefined,
      diff: rb < ra ? { key: 'lowerRes', params: { alt: rb, orig: ra }, tone: 'bad' } : undefined,
    })
  }
  if (!speaker && a.autoCutter !== null && b.autoCutter !== null) {
    const need = a.autoCutter
    out.push({
      weight: w.autoCutter,
      sim: need && !b.autoCutter ? 0 : 1,
      match: need && b.autoCutter ? { key: 'autoCutter', tone: 'good' } : undefined,
      diff: need && !b.autoCutter ? { key: 'noCutter', tone: 'bad' } : undefined,
    })
  }
  if (!speaker && a.color && b.color) {
    const same = a.color === b.color
    out.push({
      weight: w.color,
      sim: same ? 1 : 0.2,
      match: same
        ? { key: a.color === 'color' ? 'sameColor' : 'sameMono', tone: 'good' }
        : undefined,
      diff: same
        ? undefined
        : { key: b.color === 'color' ? 'colorInstead' : 'monoInstead', tone: 'neutral' },
    })
  }
  if (speaker && a.watts && b.watts) {
    const ratio = b.watts / a.watts
    const p = { alt: b.watts, orig: a.watts }
    out.push({
      weight: w.watts,
      sim: Math.min(1, ratio),
      match:
        ratio >= 0.9 && ratio <= 1.1 ? { key: 'similarPower', params: p, tone: 'good' } : undefined,
      diff:
        ratio < 0.9
          ? { key: 'lessPower', params: p, tone: 'bad' }
          : ratio > 1.1
            ? { key: 'morePower', params: p, tone: 'good' }
            : undefined,
    })
  }
  if (speaker && a.batteryHours && b.batteryHours) {
    const ratio = b.batteryHours / a.batteryHours
    const p = { alt: b.batteryHours, orig: a.batteryHours }
    out.push({
      weight: w.batteryHours,
      sim: Math.min(1, ratio),
      match:
        ratio >= 0.9 && ratio <= 1.1
          ? { key: 'similarBattery', params: p, tone: 'good' }
          : undefined,
      diff:
        ratio < 0.9
          ? { key: 'lessBattery', params: p, tone: 'bad' }
          : ratio > 1.1
            ? { key: 'moreBattery', params: p, tone: 'good' }
            : undefined,
    })
  }
  if (speaker && a.waterproof && b.waterproof) {
    out.push({ weight: w.waterproof, sim: 1, match: { key: 'alsoWaterproof', tone: 'good' } })
  }
  return out
}

/** 25 points within +-25% of the original price, tapering to 0 at +-100%. */
export function priceScore(original: number, candidate: number): number {
  if (original <= 0) return PRICE_POINTS / 2
  const d = Math.abs(candidate / original - 1)
  if (d <= 0.25) return PRICE_POINTS
  return Math.max(0, PRICE_POINTS * (1 - (d - 0.25) / 0.75))
}

function totalWeight(speaker: boolean): number {
  return Object.values(speaker ? SPEAKER_WEIGHTS : PRINTER_WEIGHTS).reduce((s, n) => s + n, 0)
}

export function compareProducts(original: Product, cand: Product): Alternative {
  const speaker = original.category === 'speaker'
  const cmps = compareSpecs(original.specs, cand.specs, speaker)
  const known = cmps.reduce((s, c) => s + c.weight, 0)
  const specPart =
    known > 0
      ? (SPEC_POINTS * cmps.reduce((s, c) => s + c.weight * c.sim, 0)) / known
      : SPEC_POINTS * NEUTRAL_SPEC
  const confidence = Math.min(1, known / totalWeight(speaker))
  const sameBrand = original.brand === cand.brand
  const offType = cand.category !== original.category
  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        specPart +
          priceScore(original.sellingPrice, cand.sellingPrice) +
          (sameBrand ? BRAND_POINTS : 0) -
          (offType ? OFF_TYPE_PENALTY : 0),
      ),
    ),
  )

  const matches: SimReason[] = cmps.flatMap((c) => (c.match ? [c.match] : []))
  const differences: SimReason[] = cmps.flatMap((c) => (c.diff ? [c.diff] : []))
  if (sameBrand) matches.push({ key: 'sameBrand', params: { v: cand.brand }, tone: 'good' })
  if (offType)
    differences.unshift({ key: 'otherType', params: { v: cand.category }, tone: 'neutral' })
  const priceDelta = cand.sellingPrice - original.sellingPrice
  if (Math.abs(priceDelta) >= 1 && Math.abs(priceDelta / original.sellingPrice) > 0.02)
    differences.unshift(
      priceDelta > 0
        ? { key: 'priceMore', params: { v: money(priceDelta) }, tone: 'bad' }
        : { key: 'priceLess', params: { v: money(priceDelta) }, tone: 'good' },
    )
  else matches.push({ key: 'similarPrice', tone: 'good' })
  return { product: cand, score, confidence, matches, differences, priceDelta }
}

/** Closest in-stock alternatives to `original` (top `limit`). Null specs are skipped, never penalised. */
export function findAlternatives(original: Product, all: Product[], limit = 3): Alternative[] {
  const inStock = (p: Product) => p.id !== original.id && p.stockStatus !== 'out_of_stock'
  let pool = all.filter((p) => inStock(p) && p.category === original.category)
  if (pool.length < limit) {
    const related = RELATED[original.category] ?? []
    pool = [...pool, ...all.filter((p) => inStock(p) && related.includes(p.category))]
  }
  return pool
    .map((p) => compareProducts(original, p))
    .sort((a, b) => b.score - a.score || Math.abs(a.priceDelta) - Math.abs(b.priceDelta))
    .slice(0, limit)
}

export type ConfidenceLevel = 'high' | 'medium' | 'low'
export const confidenceLevel = (c: number): ConfidenceLevel =>
  c >= 0.6 ? 'high' : c >= 0.3 ? 'medium' : 'low'
