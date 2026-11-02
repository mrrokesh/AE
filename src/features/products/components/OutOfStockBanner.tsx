import { useMemo } from 'react'
import { PackageX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { openAlternativeMessage } from '@/features/leads/openers'
import { useCrmStore } from '@/store/crmStore'
import { toast } from '@/store/toastStore'
import type { Lead } from '@/types'
import { addAlternative, oosInterest } from '../alternatives'
import { findAlternatives } from '../similarity'
import { AlternativeCard } from './AlternativeCard'
import { WaitlistButton } from './WaitlistButton'

/** Amber banner on Lead Detail: the product they want is out of stock, here is what to offer instead. */
export function OutOfStockBanner({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const products = useCrmStore((s) => s.products)
  const missing = useMemo(() => oosInterest(lead, products).slice(0, 2), [lead, products])
  const options = useMemo(
    () => missing.map((p) => ({ p, alts: findAlternatives(p, products, 3) })),
    [missing, products],
  )
  if (missing.length === 0 || !user) return null

  return (
    <div className="space-y-3">
      {options.map(({ p, alts }) => (
        <Card key={p.id} className="space-y-3 border-warning/60 bg-warning/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2.5">
              <PackageX className="mt-0.5 size-5 shrink-0 text-warning" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">
                  {t('catalog.alt.bannerTitle', { name: p.name })}
                </h2>
                <p className="text-xs text-fg-muted">{t('catalog.alt.bannerText')}</p>
              </div>
            </div>
            <WaitlistButton lead={lead} product={p} />
          </div>
          {alts.length === 0 ? (
            <p className="text-sm text-fg-muted">{t('catalog.alt.none')}</p>
          ) : (
            <div className="space-y-2.5">
              {alts.map((a) => (
                <AlternativeCard
                  key={a.product.id}
                  original={p}
                  alt={a}
                  budget={lead.budget}
                  added={lead.productInterest.includes(a.product.id)}
                  onAdd={() =>
                    void addAlternative(lead, p, a.product, user).then(() =>
                      toast.success(t('catalog.alt.added')),
                    )
                  }
                  onWhatsApp={() => openAlternativeMessage(lead.id, p, a)}
                />
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
