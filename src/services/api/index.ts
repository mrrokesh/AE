/**
 * Mock API. UI code imports ONLY from here (via feature hooks), never localStorage.
 * To go real: re-implement these objects with fetch() against VITE_API_BASE_URL
 * keeping the same method signatures.
 */
import type { Customer, Lead, Product, User } from '@/types'
import { createCollectionApi, delay } from './collection'
import { resetDemoData } from './storage'

export const leadsApi = createCollectionApi<Lead>({
  name: 'leads',
  idPrefix: 'l',
  searchFields: ['name', 'businessName', 'phone', 'city', 'email'],
})

export const productsApi = createCollectionApi<Product>({
  name: 'products',
  idPrefix: 'p',
  searchFields: ['name', 'brand', 'category'],
})

export const customersApi = createCollectionApi<Customer>({
  name: 'customers',
  idPrefix: 'c',
  searchFields: ['name', 'businessName', 'phone', 'city'],
})

export const usersApi = createCollectionApi<User>({
  name: 'users',
  idPrefix: 'u',
  searchFields: ['name', 'email'],
})

export const adminApi = {
  /** Wipes localStorage CRM data and reseeds. Mock-only; has no REST equivalent. */
  async resetDemoData(): Promise<void> {
    await delay()
    resetDemoData()
  },
}

export { ApiError } from './types'
export type { ListParams, Paginated } from './types'
