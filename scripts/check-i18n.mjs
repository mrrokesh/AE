// Verifies en/ta locale parity and that every literal t('key') used in src exists.
import fs from 'node:fs'
import path from 'node:path'

const root = new URL('../src/', import.meta.url).pathname
const flatten = (o, p = '', out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k
    typeof v === 'object' && v !== null ? flatten(v, key, out) : (out[key] = v)
  }
  return out
}
const PLURAL = /_(zero|one|two|few|many|other)$/
const load = (lng) => {
  const out = {}
  for (const f of fs
    .readdirSync(path.join(root, 'locales', lng))
    .filter((f) => f.endsWith('.json')))
    Object.assign(
      out,
      flatten(JSON.parse(fs.readFileSync(path.join(root, 'locales', lng, f), 'utf8'))),
    )
  return out
}
const en = load('en'),
  ta = load('ta')
const norm = (m) => new Set(Object.keys(m).map((k) => k.replace(PLURAL, '')))
const enK = norm(en),
  taK = norm(ta)
let bad = 0
for (const k of enK) if (!taK.has(k)) (console.log('missing in ta:', k), bad++)
for (const k of taK) if (!enK.has(k)) (console.log('missing in en:', k), bad++)
for (const [k, v] of Object.entries(ta)) if (v === '') (console.log('empty ta:', k), bad++)

const files = []
const walk = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .forEach((e) =>
      e.isDirectory()
        ? e.name !== 'locales' && walk(path.join(d, e.name))
        : /\.(ts|tsx)$/.test(e.name) && files.push(path.join(d, e.name)),
    )
walk(root)
// dynamic prefixes: every id in constants must have a label
const ids = (f) =>
  [
    ...fs
      .readFileSync(path.join(root, 'constants', f), 'utf8')
      .split('OPEN_STAGES')[0]
      .matchAll(/id: '([a-z_]+)'/g),
  ].map((m) => m[1])
const groups = {
  stages: ids('stages.ts').filter((x) => x),
  sources: ids('sources.ts'),
  categories: ids('categories.ts'),
}
for (const [g, list] of Object.entries(groups))
  for (const id of list)
    if (!enK.has(`${g}.${id}`) && !(g === 'stages' && false))
      (console.log('missing label key:', `${g}.${id}`), bad++)
for (const id of [
  'price',
  'bought_elsewhere',
  'not_reachable',
  'changed_mind',
  'out_of_stock',
  'other',
])
  if (!enK.has(`lostReasons.${id}`)) (console.log('missing', `lostReasons.${id}`), bad++)
const used = new Set()
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  for (const m of src.matchAll(/\b(?:t|i18n\.t)\(\s*['"`]([A-Za-z0-9_.]+)['"`]/g)) used.add(m[1])
  for (const m of src.matchAll(
    /(?:labelKey|titleKey|key|i18nKey)[:=]\s*['"]([A-Za-z0-9_.]+\.[A-Za-z0-9_.]+)['"]/g,
  ))
    used.add(m[1])
}
for (const k of used)
  if (!enK.has(k) && !k.endsWith('.')) (console.log('undefined key used in code:', k), bad++)
console.log(
  bad ? `i18n check FAILED (${bad})` : `i18n OK: ${enK.size} keys, ${used.size} used literal keys`,
)
process.exit(bad ? 1 : 0)
