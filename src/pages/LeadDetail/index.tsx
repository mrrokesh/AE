import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, EmptyState } from '@/components/ui'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { ActivityTimeline } from '@/features/leads/components/ActivityTimeline'
import { LeadFollowUpPanel } from '@/features/leads/components/LeadFollowUpPanel'
import { LeadHeader } from '@/features/leads/components/LeadHeader'
import { LeadAiPanel } from '@/features/ai/components/LeadAiPanel'
import { OutOfStockBanner } from '@/features/products/components/OutOfStockBanner'
import { LeadProducts } from '@/features/leads/components/LeadProducts'

export default function LeadDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const lead = useScopedLeads().find((l) => l.id === id)

  if (!lead)
    return (
      <Card>
        <EmptyState
          icon={UserX}
          title={t('leadDetail.notFound')}
          description={t('leadDetail.notFoundText')}
          action={
            <Link to="/leads" className="text-brand-600 underline">
              {t('leadDetail.backToLeads')}
            </Link>
          }
        />
      </Card>
    )

  return (
    <>
      <Link
        to="/leads"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t('leadDetail.backToLeads')}
      </Link>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <LeadHeader lead={lead} />
          <OutOfStockBanner lead={lead} />
          <LeadFollowUpPanel lead={lead} />
          <LeadProducts lead={lead} />
          <ActivityTimeline lead={lead} />
        </div>
        <aside className="space-y-4">
          <LeadAiPanel lead={lead} />
        </aside>
      </div>
    </>
  )
}
