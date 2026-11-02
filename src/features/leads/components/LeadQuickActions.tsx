import { CalendarClock, ClipboardCheck, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { openLogActivity, openReschedule } from '../openers'
import { telLink, waLink } from '../phone'
import { whatsappMessage } from '../waMessages'
import { useCrmStore } from '@/store/crmStore'
import type { Lead } from '@/types'

/** One-tap row actions: Call, WhatsApp (prefilled), Log outcome, Reschedule. */
export function LeadQuickActions({ lead, compact = false }: { lead: Lead; compact?: boolean }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const products = useCrmStore((s) => s.products)
  const href = waLink(lead.phone, whatsappMessage('followUp', lead, products, user, t))
  const link =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-2'
  return (
    <div className="flex flex-wrap gap-1.5">
      <a
        href={telLink(lead.phone)}
        className={`${link} text-success`}
        aria-label={t('common.call')}
      >
        <Phone className="size-4" />
        {!compact && t('common.call')}
      </a>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${link} text-success`}
        aria-label={t('common.whatsapp')}
      >
        <MessageCircle className="size-4" />
        {!compact && t('common.whatsapp')}
      </a>
      <Button onClick={() => openLogActivity(lead.id)} aria-label={t('followUps.logOutcome')}>
        <ClipboardCheck className="size-4" />
        {!compact && t('followUps.logOutcome')}
      </Button>
      <Button onClick={() => openReschedule(lead.id)} aria-label={t('followUps.reschedule')}>
        <CalendarClock className="size-4" />
        {!compact && t('followUps.reschedule')}
      </Button>
    </div>
  )
}
