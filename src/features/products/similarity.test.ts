import { describe, expect, it } from 'vitest'
import catalog from '@/data/seed/products.json'
import type { Product, ProductSpecs } from '@/types'
import { compareProducts, findAlternatives, priceScore } from './similarity'

const all = catalog as unknown as Product[]
const byName = (n: string) => all.find((p) => p.name.includes(n))!
const NO_SPECS: ProductSpecs = {
  type: 'thermal',
  printWidth: null,
  speed: null,
  resolution: null,
  autoCutter: null,
  color: null,
  duty: null,
  watts: null,
  batteryHours: null,
  waterproof: null,
  connectivity: null,
}
const mk = (
  over: Omit<Partial<Product>, 'specs'> & { specs?: Partial<ProductSpecs> },
): Product => ({
  ...all[0],
  id: 'x',
  category: 'thermal',
  brand: 'B',
  sellingPrice: 10000,
  stockStatus: 'in_stock',
  ...over,
  specs: { ...NO_SPECS, ...over.specs },
})

describe('similarity', () => {
  it('never suggests out-of-stock products or the product itself', () => {
    const orig = byName('TVS RP 3230 Thermal')
    const alts = findAlternatives(orig, all)
    expect(alts).toHaveLength(3)
    for (const a of alts) {
      expect(a.product.stockStatus).not.toBe('out_of_stock')
      expect(a.product.id).not.toBe(orig.id)
    }
  })
  it('only suggests the same category when enough exist', () => {
    const alts = findAlternatives(byName('HP 1200A'), all)
    expect(alts.every((a) => a.product.category === 'laser')).toBe(true)
  })
  it('sorts by score and keeps scores in 0-100', () => {
    const alts = findAlternatives(byName('Epson EcoTank L3210'), all)
    const scores = alts.map((a) => a.score)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    }
  })
  it('does not penalise null specs but lowers confidence', () => {
    const orig = mk({})
    const bare = compareProducts(orig, mk({ id: 'y' }))
    const rich = compareProducts(
      mk({ specs: { printWidth: '3"', color: 'mono' } }),
      mk({ id: 'y', specs: { printWidth: '3"', color: 'mono' } }),
    )
    expect(bare.confidence).toBe(0)
    expect(rich.confidence).toBeGreaterThan(bare.confidence)
    expect(bare.score).toBeGreaterThanOrEqual(60) // same price + neutral specs
  })
  it('rewards matching print width and reports the match', () => {
    const o = mk({ specs: { printWidth: '3"' } })
    const same = compareProducts(o, mk({ id: 'a', specs: { printWidth: '3"' } }))
    const diff = compareProducts(o, mk({ id: 'b', specs: { printWidth: '2"' } }))
    expect(same.score).toBeGreaterThan(diff.score)
    expect(same.matches.map((m) => m.key)).toContain('sameWidth')
    expect(diff.differences.map((m) => m.key)).toContain('diffWidth')
  })
  it('flags cheaper vs costlier and connectivity differences', () => {
    const o = mk({ specs: { connectivity: ['USB', 'Bluetooth'] } })
    const a = compareProducts(
      o,
      mk({ id: 'a', sellingPrice: 11050, specs: { connectivity: ['USB', 'Bluetooth', 'LAN'] } }),
    )
    expect(a.priceDelta).toBe(1050)
    expect(a.differences.find((d) => d.key === 'priceMore')?.params?.v).toBe('₹1,050')
    expect(a.differences.map((d) => d.key)).toContain('extraConn')
    expect(a.matches.find((m) => m.key === 'alsoConn')?.params?.v).toBe('USB + Bluetooth')
    expect(compareProducts(o, mk({ id: 'c', sellingPrice: 9000 })).differences[0].key).toBe(
      'priceLess',
    )
  })
  it('scores price closeness: best within 25%, tapering to zero', () => {
    expect(priceScore(10000, 12000)).toBe(25)
    expect(priceScore(10000, 7600)).toBe(25)
    expect(priceScore(10000, 20000)).toBe(0)
    expect(priceScore(10000, 15000)).toBeGreaterThan(priceScore(10000, 18000))
  })
  it('works for speakers (watts, battery, waterproof)', () => {
    const o = mk({
      category: 'speaker',
      specs: { type: 'speaker', watts: 20, batteryHours: 12, waterproof: 'IPX7' },
    })
    const a = compareProducts(
      o,
      mk({
        id: 'a',
        category: 'speaker',
        specs: { type: 'speaker', watts: 10, batteryHours: 12, waterproof: 'IPX7' },
      }),
    )
    const keys = [...a.matches, ...a.differences].map((r) => r.key)
    expect(keys).toEqual(expect.arrayContaining(['lessPower', 'similarBattery', 'alsoWaterproof']))
  })
})
