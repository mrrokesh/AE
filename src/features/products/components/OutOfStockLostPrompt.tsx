import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellPlus, GitCompareArrows } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { leadName } from '@/features/leads/format'
import { useCrmStore } from '@/store/crmStore'
import { toast } from '@/store/toastStore'
import type { Lead } from '@/types'
import { waitlistAll } from '../alternatives'

/**
 * Shown when a lead is about to be marked Lost for "out of stock": the sale can often still be saved.
 * `onWaitlisted` lets the caller decide what happens next (default: just close, lead stays open).
 */
export function OutOfStockLostPrompt({
  lead,
  onClose,
  onLostAnyway,
  onWaitlisted,
}: {
  lead: Lead
  onClose: () => void
  onLostAnyway: () => void
  onWaitlisted?: (lead: Lead) => Promise<void> | void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useCurrentUser()
  const products = useCrmStore((s) => s.products)
  const [busy, setBusy] = useState(false)

  const waitlist = async () => {
    if (!user) return
    setBusy(true)
    try {
      const updated = await waitlistAll(lead, products, user)
      toast.success(t('catalog.lostPrompt.waitlisted'))
      if (onWaitlisted) await onWaitlisted(updated)
      else onClose()
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">
        {t('catalog.lostPrompt.text', { name: leadName(lead) })}
      </p>
      <div className="grid gap-2">
        <Button
          variant="primary"
          onClick={() => {
            onClose()
            navigate(`/leads/${lead.id}`)
          }}
        >
          <GitCompareArrows className="size-4" />
          {t('catalog.lostPrompt.alternatives')}
        </Button>
        <Button disabled={busy} onClick={() => void waitlist()}>
          <BellPlus className="size-4" />
          {t('catalog.lostPrompt.waitlist')}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onLostAnyway}>
          {t('catalog.lostPrompt.lostAnyway')}
        </Button>
      </div>
    </div>
  )
}
