import type { TFunction } from 'i18next'
import { formatINR } from '@/lib/format'
import type { Lead, Product, User } from '@/types'
import { leadName } from './format'

export type WaKind = 'followUp' | 'offer' | 'visit' | 'thanks'
export const WA_KINDS: WaKind[] = ['followUp', 'offer', 'visit', 'thanks']

/** Prefilled WhatsApp text from `wa.*` templates, in the current language (or `lng` override). */
export function whatsappMessage(
  kind: WaKind,
  lead: Lead,
  products: Product[],
  staff: User | null,
  t: TFunction,
  lng?: string,
): string {
  const p = products.find((x) => x.id === lead.productInterest[0])
  return t(`wa.${kind}`, {
    lng,
    name: leadName(lead).split(' ')[0],
    staff: staff?.name.split(' ')[0] ?? '',
    product: p?.name ?? t('wa.yourEnquiry', { lng }),
    price: p ? formatINR(p.sellingPrice) : '',
    mrp: p ? formatINR(p.mrp) : '',
  })
}
