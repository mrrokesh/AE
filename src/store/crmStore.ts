import { create } from 'zustand'
import { customersApi, leadsApi, productsApi, usersApi } from '@/services/api'
import type { Customer, Lead, Product, User } from '@/types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface CrmState {
  status: Status
  leads: Lead[]
  products: Product[]
  users: User[]
  customers: Customer[]
  load: () => Promise<void>
  /** Insert or replace a lead after an API write. */
  applyLead: (lead: Lead) => void
  applyLeads: (leads: Lead[]) => void
  /** Replace a product after an API write. */
  applyProduct: (product: Product) => void
}

/** Client cache of server data. Written ONLY by features/ actions after a successful API call. */
export const useCrmStore = create<CrmState>((set, get) => ({
  status: 'idle',
  leads: [],
  products: [],
  users: [],
  customers: [],
  load: async () => {
    if (get().status === 'loading') return
    set({ status: 'loading' })
    try {
      const [l, p, u, c] = await Promise.all([
        leadsApi.list({ pageSize: 1000 }),
        productsApi.list({ pageSize: 1000 }),
        usersApi.list({ pageSize: 100 }),
        customersApi.list({ pageSize: 1000 }),
      ])
      set({ leads: l.data, products: p.data, users: u.data, customers: c.data, status: 'ready' })
    } catch {
      set({ status: 'error' })
    }
  },
  applyLead: (lead) =>
    set((s) => ({
      leads: s.leads.some((x) => x.id === lead.id)
        ? s.leads.map((x) => (x.id === lead.id ? lead : x))
        : [lead, ...s.leads],
    })),
  applyProduct: (product) =>
    set((s) => ({ products: s.products.map((x) => (x.id === product.id ? product : x)) })),
  applyLeads: (list) => {
    const map = new Map(list.map((l) => [l.id, l]))
    set((s) => ({ leads: s.leads.map((l) => map.get(l.id) ?? l) }))
  },
}))
