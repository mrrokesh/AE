import type { TFunction } from 'i18next'
import { formatDate } from '@/lib/dates'
import { formatPhone } from '@/lib/format'
import type { Activity, Lead, Product } from '@/types'

/** Name is optional on quick-add; fall back to the phone number. */
export const leadName = (lead: Pick<Lead, 'name' | 'phone'>) =>
  lead.name.trim() || formatPhone(lead.phone)

export const productList = (lead: Lead, products: Product[]) =>
  lead.productInterest
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p)

export const productSummary = (lead: Lead, products: Product[]) =>
  productList(lead, products)
    .map((p) => p.name)
    .join(', ')

/** Renders a timeline entry in the current language (system keys are translated, staff text is verbatim). */
export function activityText(a: Activity, t: TFunction): string {
  const params: Record<string, string | number> = { ...a.params }
  if (typeof params.stage === 'string') params.stage = t(`stages.${params.stage}`)
  if (typeof params.date === 'string')
    params.date = params.date ? formatDate(params.date) : t('catalog.restockUnknownShort')
  const base = a.key ? t(a.key, params) : ''
  return [base, a.text].filter(Boolean).join(' · ')
}
