import { BellPlus, BellRing } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { formatDate } from '@/lib/dates'
import { toast } from '@/store/toastStore'
import type { Lead, Product } from '@/types'
import { joinWaitlist, restockFollowUp } from '../waitlist'

/** "Notify when back in stock": joins the waitlist and schedules a follow-up around the restock date. */
export function WaitlistButton({ lead, product }: { lead: Lead; product: Product }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const [busy, setBusy] = useState(false)
  const on = lead.waitlist.includes(product.id)
  const when = product.restockEta ? formatDate(product.restockEta) : null
  if (on)
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
        <BellRing className="size-4" />
        {t('catalog.waitlist.on')}
      </span>
    )
  return (
    <Button
      disabled={busy}
      onClick={async () => {
        if (!user) return
        setBusy(true)
        try {
          await joinWaitlist(lead.id, product, user)
          toast.success(t('catalog.waitlist.joined', { name: product.name }))
        } catch {
          toast.error(t('errors.generic'))
        } finally {
          setBusy(false)
        }
      }}
      title={when ? t('catalog.waitlist.expected', { date: when }) : t('catalog.waitlist.unknown')}
    >
      <BellPlus className="size-4" />
      {t('catalog.waitlist.notify')}
      <span className="text-xs text-fg-muted">
        {when ?? formatDate(restockFollowUp(product).date)}
      </span>
    </Button>
  )
}
