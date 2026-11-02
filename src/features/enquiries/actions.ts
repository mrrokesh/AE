import i18n from '@/i18n'
import { leadsApi } from '@/services/api'
import { playChime } from '@/lib/sound'
import { showNotification } from '@/lib/notify'
import { generateId } from '@/lib/id'
import { useCrmStore } from '@/store/crmStore'
import { useSettingsStore } from '@/store/settingsStore'
import { toast } from '@/store/toastStore'
import type { Lead } from '@/types'
import { ENQUIRY_TEMPLATES } from './templates'

let cursor = Math.floor(Math.random() * ENQUIRY_TEMPLATES.length)

/** Creates one unassigned website lead and alerts the user (toast + chime + browser notification). */
export async function receiveWebsiteEnquiry(): Promise<Lead> {
  const crm = useCrmStore.getState()
  const tpl = ENQUIRY_TEMPLATES[cursor++ % ENQUIRY_TEMPLATES.length]
  const product = crm.products.find((p) => p.id === tpl.productId)
  const now = Date.now()
  const lead = await leadsApi.create({
    name: tpl.name,
    businessName: '',
    phone: '9' + String(100000000 + Math.floor(Math.random() * 899999999)),
    email: `${tpl.name.split(' ')[0].toLowerCase()}@gmail.com`,
    city: tpl.city,
    source: 'website',
    productInterest: product ? [product.id] : [],
    quantity: 1,
    budget: null,
    stage: 'new',
    assignedTo: null,
    nextFollowUpAt: new Date(now + useSettingsStore.getState().slaMinutes * 60_000).toISOString(),
    firstContactedAt: null,
    lastContactedAt: null,
    lostReason: null,
    activities: [
      {
        id: generateId('a'),
        type: 'system',
        key: 'act.enquiry.website',
        params: { product: product?.name ?? '—' },
        text: tpl.message,
        at: new Date(now).toISOString(),
        by: 'u_1',
      },
    ],
    tags: [],
  })
  crm.applyLead(lead)
  const title = i18n.t('inbox.newEnquiry')
  const body = i18n.t('inbox.newEnquiryText', { name: tpl.name, product: product?.name ?? '' })
  toast.info(title, body)
  playChime()
  showNotification(title, body, `enq-${lead.id}`)
  return lead
}
