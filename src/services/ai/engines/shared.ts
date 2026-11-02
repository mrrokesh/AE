import i18n from '@/i18n'
import { formatPhone } from '@/lib/format'
import type { Lead, Product } from '@/types'
import type { Lang } from '../types'

/** Translate in an explicit language (AI output follows the UI language). */
export const tr = (lng: Lang, key: string, params?: Record<string, unknown>) =>
  i18n.t(key, { lng, ...params })

export const nm = (l: Lead) => l.name.trim() || formatPhone(l.phone)
export const firstProduct = (l: Lead, products: Product[]) =>
  products.find((p) => p.id === l.productInterest[0])
export const istHour = (t: number) => new Date(t + 5.5 * 3_600_000).getUTCHours()
export const DAY = 86_400_000
