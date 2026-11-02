/**
 * One-time importer: pulls the real catalog from https://anitaenterprises.in (WooCommerce)
 * and writes src/data/seed/products.json. NOT part of the app bundle (browser fetches hit CORS).
 *
 *   npx tsx scripts/import-products.ts
 *
 * 1) WooCommerce Store API (public).  2) Fallback: product sitemap -> product pages (cheerio).
 * Specs are PARSED from the page text; anything not found stays null (never invented).
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Connectivity, Product, ProductSpecs, StockStatus } from '../src/types/index'

const BASE = 'https://anitaenterprises.in'
const OUT = fileURLToPath(new URL('../src/data/seed/products.json', import.meta.url))
const UA = { 'User-Agent': 'Mozilla/5.0 (demo-seed-import)' }
const STAMP = '2026-01-05T04:30:00.000Z'

type Category = Product['category']

interface Raw {
  id: string
  name: string
  permalink: string
  regular: number
  sale: number | null
  inStock: boolean
  lowStock: number | null
  categories: string[]
  images: string[]
  text: string // short description + description, tags stripped
  shortText: string
}

// ---------- helpers ----------
const ENT: Record<string, string> = { amp: '&', nbsp: ' ', quot: '"', lt: '<', gt: '>', apos: "'" }
const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
const strip = (h: string) =>
  decode(h.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
const num = (s: string) => Number(s.replace(/,/g, ''))

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: UA })
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

// ---------- source 1: Store API ----------
interface StoreProduct {
  id: number | string
  name: string
  permalink: string
  short_description: string
  description: string
  is_in_stock: boolean
  low_stock_remaining: number | null
  prices: { regular_price: string; sale_price: string; price: string; currency_minor_unit: number }
  categories: { name: string }[]
  images: { src: string }[]
}

async function fromStoreApi(): Promise<Raw[]> {
  const out: Raw[] = []
  for (let page = 1; page < 50; page++) {
    const rows = await getJson<StoreProduct[]>(
      `${BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}`,
    )
    if (!rows || rows.length === 0) break
    for (const p of rows) {
      const div = 10 ** (p.prices.currency_minor_unit ?? 2)
      const regular = Number(p.prices.regular_price || p.prices.price) / div
      const sale = p.prices.sale_price ? Number(p.prices.sale_price) / div : null
      out.push({
        id: String(p.id),
        name: strip(p.name),
        permalink: p.permalink,
        regular,
        sale,
        inStock: p.is_in_stock,
        lowStock: p.low_stock_remaining,
        categories: p.categories.map((c) => decode(c.name)),
        images: p.images.map((i) => i.src),
        shortText: strip(p.short_description),
        text: strip(`${p.short_description} ${p.description}`),
      })
    }
    console.log(`  store API page ${page}: ${rows.length} products`)
  }
  return out
}

// ---------- source 2: sitemap + product pages ----------
async function fromSitemap(): Promise<Raw[]> {
  const { load } = await import('cheerio')
  const get = async (u: string) => {
    try {
      const r = await fetch(u, { headers: UA })
      return r.ok ? await r.text() : null
    } catch {
      return null
    }
  }
  const urls: string[] = []
  for (const idx of ['/product-sitemap.xml', '/wp-sitemap.xml']) {
    const xml = await get(BASE + idx)
    if (!xml) continue
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    const sub = locs.filter((l) => /product/.test(l) && l.endsWith('.xml'))
    if (sub.length) {
      for (const s of sub)
        urls.push(...[...((await get(s)) ?? '').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
    } else urls.push(...locs.filter((l) => l.includes('/product/')))
    if (urls.length) break
  }
  const out: Raw[] = []
  for (const url of [...new Set(urls)].filter((u) => u.includes('/product/'))) {
    const html = await get(url)
    if (!html) continue
    const $ = load(html)
    const price = (sel: string) => {
      const t = $(sel)
        .first()
        .text()
        .replace(/[^\d.]/g, '')
      return t ? Number(t) : null
    }
    const sale = price('p.price ins .amount')
    const regular = price('p.price del .amount') ?? price('p.price .amount')
    if (regular === null) continue
    const desc = $('.woocommerce-product-details__short-description, #tab-description').text()
    out.push({
      id: String($('[name=add-to-cart]').attr('value') ?? url.split('/').filter(Boolean).pop()),
      name: $('h1.product_title').text().trim(),
      permalink: url,
      regular,
      sale: sale ?? null,
      inStock: !$('.out-of-stock').length,
      lowStock: null,
      categories: $('.posted_in a')
        .map((_, a) => $(a).text().trim())
        .get(),
      images: $('.woocommerce-product-gallery img')
        .map((_, i) => $(i).attr('data-large_image') ?? $(i).attr('src') ?? '')
        .get()
        .filter(Boolean),
      shortText: strip($('.woocommerce-product-details__short-description').html() ?? ''),
      text: strip(desc),
    })
    console.log(`  page ${out.length}/${urls.length}: ${url}`)
  }
  return out
}

// ---------- classification ----------
const KNOWN_BRANDS: [RegExp, string][] = [
  [/\btvs\b/i, 'TVS Electronics'],
  [/\bhp\b/i, 'HP'],
  [/\bbrother\b/i, 'Brother'],
  [/\bepson\b/i, 'Epson'],
  [/\bcanon\b/i, 'Canon'],
  [/\bjbl\b/i, 'JBL'],
  [/\bzebronics\b/i, 'Zebronics'],
  [/\bfingers\b/i, 'Fingers'],
  [/\bportronics\b/i, 'Portronics'],
  [/\byamaha\b/i, 'Yamaha'],
  [/\bzebra\b/i, 'Zebra'],
  [/\bsony\b/i, 'Sony'],
  [/\bboat\b/i, 'boAt'],
  [/\bibal+\b/i, 'iBall'],
  [/\bbosch\b/i, 'Bosch'],
  [/\bamkette\b/i, 'Amkette'],
  [/\bartis\b/i, 'Artis'],
  [/\blivetech\b/i, 'LiveTech'],
  [/\brugtek\b/i, 'Rugtek'],
  [/\bcoconut\b/i, 'Coconut'],
]
/** Site data quirks, applied explicitly (and logged) instead of guessing silently. */
const BRAND_OVERRIDES: Record<string, string> = { 'Printer Smart Tank 525 Ink Tank Printer': 'HP' }

function brandOf(r: Raw): string {
  if (BRAND_OVERRIDES[r.name]) return BRAND_OVERRIDES[r.name]
  const hit =
    KNOWN_BRANDS.find(([re]) => re.test(r.name)) ??
    KNOWN_BRANDS.find(([re]) => re.test(r.shortText))
  if (hit) return hit[1]
  const m = r.shortText.match(/\bBrand\s+([A-Za-z][\w-]*)/)
  return m ? m[1] : r.name.split(' ')[0]
}

function categoryOf(r: Raw): Category {
  const c = r.categories.join('|').toLowerCase()
  if (/speaker/.test(c)) return 'speaker'
  if (/label/.test(c)) return 'label'
  if (/thermal/.test(c)) return 'thermal'
  if (/dot matrix/.test(c)) return 'dot_matrix'
  if (/laser/.test(c)) return 'laser'
  if (/ink tank/.test(c)) return 'ink_tank'
  if (/photo/.test(c)) return 'photo'
  if (/cartridge/.test(c)) return 'cartridge'
  if (/speaker/i.test(r.name)) return 'speaker'
  return 'accessory'
}

// ---------- spec parsing (null when not found) ----------
function connectivityOf(text: string, speaker: boolean): Connectivity[] | null {
  const found: Connectivity[] = []
  const add = (re: RegExp, v: Connectivity) => re.test(text) && found.push(v)
  add(/\busb\b/i, 'USB')
  add(/bluetooth|\bbt\b|\bbt ?v?\d/i, 'Bluetooth')
  add(/\blan\b|ethernet|network-ready/i, 'LAN')
  add(/wi-?fi|wireless lan/i, 'WiFi')
  add(/\bserial\b|rs-?232/i, 'Serial')
  if (speaker) {
    add(/\baux\b|3\.5\s?mm/i, 'AUX')
    add(/\bhdmi\b/i, 'HDMI')
  }
  return found.length ? found : null
}

function parseSpecs(r: Raw, category: Category): ProductSpecs {
  const speaker = category === 'speaker'
  const t = `${r.name}. ${r.text}`
  const first = (re: RegExp) => t.match(re)

  let printWidth: string | null = null
  let speed: ProductSpecs['speed'] = null
  let resolution: string | null = null
  let autoCutter: boolean | null = null
  let color: ProductSpecs['color'] = null
  let duty: number | null = null
  let watts: number | null = null
  let batteryHours: number | null = null
  let waterproof: string | null = null

  if (!speaker) {
    const w = first(/(?:print(?:ing)?|paper|roll|media)\s*width[\s\S]{0,25}?(\d{2,3})\s*mm/i)
    if (w)
      printWidth =
        (
          { 58: '2"', 57: '2"', 80: '3"', 79: '3"', 112: '4"', 104: '4"' } as Record<number, string>
        )[Number(w[1])] ?? null
    const wi = first(/\b([234])\s*(?:inch|in\b|")\s*(?:thermal|label|receipt|print)/i)
    if (!printWidth && wi) printWidth = `${wi[1]}"`

    const sp =
      first(
        /max(?:imum)? print speed monochrome[:\s]*(\d+(?:\.\d+)?)\s*(ppm|ipm|pages per minute|pages per second|mm\/s|mm per second)/i,
      ) ??
      first(
        /(\d+(?:\.\d+)?)\s*(ppm|ipm|mm\/s(?:ec)?|mm per second|pages per minute|pages per second)\b/i,
      )
    if (sp) {
      const u = sp[2].toLowerCase()
      const unit = u.startsWith('mm')
        ? 'mm/s'
        : u === 'ipm'
          ? 'ipm'
          : u.includes('second')
            ? 'pages/s'
            : 'ppm'
      speed = { value: Number(sp[1]), unit }
    }
    const dpi = first(/(\d{3,4})\s*[x×]\s*(\d{3,4})\s*dpi/i)
    const dpi1 = first(/(\d{3,4})\s*dpi/i)
    resolution = dpi ? `${dpi[1]} x ${dpi[2]} dpi` : dpi1 ? `${dpi1[1]} dpi` : null

    if (/auto[- ]?cut|automatic[^.,|]{0,30}cutter/i.test(t)) autoCutter = true
    else if (/(?:no|without)\s+(?:auto[- ]?)?cutter/i.test(t)) autoCutter = false

    const out = first(/printer output(?: type)?[:\s]*(monochrome|mono|colou?r|black)/i)
    if (out) color = /colou?r/i.test(out[1]) ? 'color' : 'mono'
    const d = first(/duty cycle[^0-9]{0,40}([\d,]{3,})/i)
    if (d) duty = num(d[1])
  } else {
    const w =
      first(
        /(?:maximum output power|output power(?: \(rms\))?|power output|rms output|total power|rms)[:\s]*(\d+(?:\.\d+)?)\s*(?:w|watts?)\b/i,
      ) ??
      first(/\b(\d+(?:\.\d+)?)\s*(?:w|watts?)\s*(?:rms|output|\(rms\))/i) ??
      first(/\b(\d+(?:\.\d+)?)\s?w\b(?!\s*[x×])/i)
    if (w) watts = Number(w[1])
    const b =
      first(
        /(?:battery(?: average)? life|playback time|play ?time|battery backup)[^0-9]{0,15}(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i,
      ) ?? first(/up ?to\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i)
    if (b) batteryHours = Number(b[1])
    const ip = first(/\bIP[X]?\d{1,2}\b/i)
    if (ip) waterproof = ip[0].toUpperCase()
    else if (
      /is waterproof\s+true|\bwaterproof\b/i.test(t) &&
      !/not waterproof|non[- ]waterproof/i.test(t)
    )
      waterproof = 'Waterproof'
  }

  return {
    type: category,
    printWidth,
    speed,
    resolution,
    autoCutter,
    color,
    duty,
    watts,
    batteryHours,
    waterproof,
    connectivity: connectivityOf(t, speaker),
  }
}

// ---------- demo stock ----------
function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function assignStock(items: Product[]) {
  const rnd = mulberry(20260105)
  const day = 86_400_000
  const eta = (d: number) => new Date(Date.now() + d * day).toISOString().slice(0, 10)
  const site = new Map(items.map((p) => [p.id, p.stockStatus]))
  for (const p of items) {
    // Respect the site: anything the site already says is out of stock stays out of stock.
    if (site.get(p.id) === 'out_of_stock') {
      p.stockQty = 0
      p.restockEta = rnd() < 0.7 ? eta(3 + Math.floor(rnd() * 10)) : null
    } else {
      p.stockQty = 4 + Math.floor(rnd() * 22)
      p.stockStatus = 'in_stock'
      p.restockEta = null
    }
  }
  // Pick ~20% out of stock, ~15% low, spread by category and never emptying a category.
  const pool = items.filter((p) => p.stockStatus === 'in_stock').sort(() => rnd() - 0.5)
  const target = (f: number) => Math.round(items.length * f)
  const outNow = items.filter((p) => p.stockStatus === 'out_of_stock').length
  let needOut = Math.max(0, target(0.2) - outNow)
  let needLow = target(0.15)
  for (const p of pool) {
    const sameCat = items.filter((x) => x.category === p.category && x.stockStatus === 'in_stock')
    if (needOut > 0 && sameCat.length > 2) {
      p.stockStatus = 'out_of_stock'
      p.stockQty = 0
      p.restockEta = rnd() < 0.7 ? eta(3 + Math.floor(rnd() * 10)) : null
      needOut--
    } else if (needLow > 0) {
      p.stockStatus = 'low'
      p.stockQty = 1 + Math.floor(rnd() * 3)
      needLow--
    }
  }
  // Guarantee >= 3 out-of-stock products that have an in-stock alternative in the same category.
  const withAlt = () =>
    items.filter(
      (p) =>
        p.stockStatus === 'out_of_stock' &&
        items.some((x) => x.category === p.category && x.stockStatus === 'in_stock'),
    )
  for (const p of pool) {
    if (withAlt().length >= 3) break
    if (
      p.stockStatus === 'in_stock' &&
      items.filter((x) => x.category === p.category && x.stockStatus === 'in_stock').length > 1
    ) {
      p.stockStatus = 'out_of_stock'
      p.stockQty = 0
      p.restockEta = eta(5)
    }
  }
}

// ---------- main ----------
async function main() {
  console.log('Trying WooCommerce Store API ...')
  let raw = await fromStoreApi()
  if (raw.length === 0) {
    console.log('Store API empty/blocked. Falling back to sitemap + product pages ...')
    raw = await fromSitemap()
  }
  if (raw.length === 0) throw new Error('No products could be fetched from either source.')

  const products: Product[] = raw
    .filter((r) => r.regular > 0)
    .map((r) => {
      const category = categoryOf(r)
      const selling = r.sale && r.sale < r.regular ? r.sale : r.regular
      const status: StockStatus = r.inStock ? 'in_stock' : 'out_of_stock'
      return {
        id: `p${r.id}`,
        name: r.name,
        brand: brandOf(r),
        category,
        mrp: Math.round(r.regular),
        sellingPrice: Math.round(selling),
        images: r.images,
        url: r.permalink,
        specs: parseSpecs(r, category),
        specsSource: 'parsed' as const,
        stockQty: r.lowStock ?? 0,
        stockStatus: r.lowStock !== null && r.lowStock <= 3 && r.inStock ? 'low' : status,
        restockEta: null,
        createdAt: STAMP,
        updatedAt: STAMP,
      }
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  assignStock(products)

  writeFileSync(OUT, JSON.stringify(products, null, 2) + '\n')

  // ---- summary ----
  const by = <K extends string>(f: (p: Product) => K) =>
    Object.entries(
      products.reduce<Record<string, number>>((m, p) => ((m[f(p)] = (m[f(p)] ?? 0) + 1), m), {}),
    )
  console.log(`\nWrote ${products.length} products -> ${OUT}`)
  console.log('By category:', Object.fromEntries(by((p) => p.category)))
  console.log('Brand overrides applied:', Object.keys(BRAND_OVERRIDES).join('; '))
  console.log('By brand:', Object.fromEntries(by((p) => p.brand)))
  console.log('Stock:', Object.fromEntries(by((p) => p.stockStatus)))
  console.log('Without images:', products.filter((p) => p.images.length === 0).length)
  const keys = Object.keys(products[0].specs).filter((k) => k !== 'type') as (keyof ProductSpecs)[]
  const withAny = products.filter((p) => keys.some((k) => p.specs[k] !== null)).length
  console.log(`Products with >=1 parsed spec: ${withAny}/${products.length} (specsSource=parsed)`)
  for (const group of [
    [
      'printers',
      (p: Product) => p.category !== 'speaker',
      ['printWidth', 'speed', 'resolution', 'autoCutter', 'color', 'duty', 'connectivity'],
    ],
    [
      'speakers',
      (p: Product) => p.category === 'speaker',
      ['watts', 'batteryHours', 'waterproof', 'connectivity'],
    ],
  ] as const) {
    const list = products.filter(group[1])
    console.log(`Null specs, ${group[0]} (${list.length}):`)
    for (const k of group[2]) {
      const nulls = list.filter((p) => p.specs[k as keyof ProductSpecs] === null).length
      console.log(
        `  ${k.padEnd(13)} null ${String(nulls).padStart(3)} / parsed ${list.length - nulls}`,
      )
    }
  }
  const outs = products.filter((p) => p.stockStatus === 'out_of_stock')
  console.log(
    `Out of stock with in-stock alternative in category: ${outs.filter((p) => products.some((x) => x.category === p.category && x.stockStatus === 'in_stock')).length}/${outs.length}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
