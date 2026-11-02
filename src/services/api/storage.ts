import { buildSeed } from '@/data/seed'

const PREFIX = 'anita-crm:data:'
const SEEDED_KEY = `${PREFIX}__seeded`
/** Bump when the seed shape changes; old browsers get reseeded automatically. */
const SEED_VERSION = 'v3'
const COLLECTIONS = ['users', 'products', 'leads', 'customers'] as const

export function readCollection<T>(name: string): T[] {
  ensureSeeded()
  try {
    return JSON.parse(localStorage.getItem(PREFIX + name) ?? '[]') as T[]
  } catch {
    return []
  }
}

export function writeCollection<T>(name: string, items: T[]): void {
  localStorage.setItem(PREFIX + name, JSON.stringify(items))
}

function ensureSeeded(): void {
  if (localStorage.getItem(SEEDED_KEY) !== SEED_VERSION) seed()
}

function seed(): void {
  const data = buildSeed()
  for (const name of COLLECTIONS) writeCollection<unknown>(name, data[name])
  localStorage.setItem(SEEDED_KEY, SEED_VERSION)
}

/** Wipe all CRM data and reseed from src/data/seed. */
export function resetDemoData(): void {
  for (const name of COLLECTIONS) localStorage.removeItem(PREFIX + name)
  localStorage.removeItem(SEEDED_KEY)
  seed()
}
