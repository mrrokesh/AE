import { generateId } from '@/lib/id'
import type { CreateInput, Entity, UpdateInput } from '@/types'
import { readCollection, writeCollection } from './storage'
import { ApiError, type ListParams, type Paginated } from './types'

/** Simulated network latency (200-500ms). */
export const delay = (min = 200, max = 500) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)))

interface Options<T> {
  name: string
  idPrefix: string
  searchFields: (keyof T)[]
}

function matches(value: unknown, wanted: unknown): boolean {
  if (Array.isArray(wanted)) return wanted.some((w) => matches(value, w))
  if (Array.isArray(value)) return value.includes(wanted)
  return value === wanted
}

/**
 * Generic REST-shaped CRUD over localStorage.
 * Signatures mirror a REST client: GET /x, GET /x/:id, POST /x, PATCH /x/:id, DELETE /x/:id.
 */
export function createCollectionApi<T extends Entity>({
  name,
  idPrefix,
  searchFields,
}: Options<T>) {
  const all = () => readCollection<T>(name)

  return {
    async list(params: ListParams = {}): Promise<Paginated<T>> {
      await delay()
      const { search, filters, sortBy, sortDir = 'asc', page = 1, pageSize = 50 } = params
      let rows = all()
      if (search?.trim()) {
        const q = search.trim().toLowerCase()
        rows = rows.filter((r) =>
          searchFields.some((f) =>
            String(r[f] ?? '')
              .toLowerCase()
              .includes(q),
          ),
        )
      }
      for (const [field, wanted] of Object.entries(filters ?? {})) {
        if (wanted === undefined || wanted === '' || wanted === null) continue
        rows = rows.filter((r) => matches((r as Record<string, unknown>)[field], wanted))
      }
      if (sortBy) {
        const dir = sortDir === 'asc' ? 1 : -1
        rows = [...rows].sort((a, b) => {
          const x = (a as Record<string, unknown>)[sortBy] as string | number | null
          const y = (b as Record<string, unknown>)[sortBy] as string | number | null
          if (x === y) return 0
          if (x == null) return 1
          if (y == null) return -1
          return x > y ? dir : -dir
        })
      }
      const total = rows.length
      const start = (page - 1) * pageSize
      return { data: rows.slice(start, start + pageSize), total, page, pageSize }
    },

    async get(id: string): Promise<T> {
      await delay()
      const row = all().find((r) => r.id === id)
      if (!row) throw new ApiError(404, `${name} ${id} not found`)
      return row
    },

    async create(input: CreateInput<T>): Promise<T> {
      await delay()
      const now = new Date().toISOString()
      const row = { ...input, id: generateId(idPrefix), createdAt: now, updatedAt: now } as T
      writeCollection(name, [row, ...all()])
      return row
    },

    async update(id: string, patch: UpdateInput<T>): Promise<T> {
      await delay()
      const rows = all()
      const i = rows.findIndex((r) => r.id === id)
      if (i < 0) throw new ApiError(404, `${name} ${id} not found`)
      const next = { ...rows[i], ...patch, id, updatedAt: new Date().toISOString() }
      rows[i] = next
      writeCollection(name, rows)
      return next
    },

    async remove(id: string): Promise<void> {
      await delay()
      const rows = all()
      if (!rows.some((r) => r.id === id)) throw new ApiError(404, `${name} ${id} not found`)
      writeCollection(
        name,
        rows.filter((r) => r.id !== id),
      )
    },
  }
}
