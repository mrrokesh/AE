import { Link } from 'react-router-dom'
import { Inbox as InboxIcon, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { Badge, Button, Card, EmptyState, Select } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { isOwner } from '@/features/auth/permissions'
import { useUnassigned } from '@/features/enquiries/useUnassigned'
import { assignLead, claimLead } from '@/features/leads/actions'
import { SlaBadge } from '@/features/leads/components/SlaBadge'
import { leadName, productSummary } from '@/features/leads/format'
import { telLink, waLink } from '@/features/leads/phone'
import { formatRelative } from '@/lib/dates'
import { formatPhone } from '@/lib/format'
import { useCrmStore } from '@/store/crmStore'
import { toast } from '@/store/toastStore'
import type { Lead } from '@/types'

function InboxCard({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { products, users } = useCrmStore()
  const staff = users.filter((u) => u.role === 'staff')
  const message = lead.activities.find((a) => a.text)?.text

  const claim = async () => {
    if (!user) return
    await claimLead(lead.id, user)
    toast.success(t('inbox.claimedToast', { name: leadName(lead) }))
  }
  const assign = async (id: string) => {
    const target = users.find((u) => u.id === id)
    if (!user || !target) return
    await assignLead(lead.id, target, user)
    toast.success(t('inbox.assignedToast', { name: target.name }))
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/leads/${lead.id}`} className="font-semibold hover:underline">
            {leadName(lead)}
          </Link>
          <p className="text-xs text-fg-muted">
            {formatPhone(lead.phone)} · {lead.city}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="info">{t(`sources.${lead.source}`)}</Badge>
          <SlaBadge lead={lead} />
        </div>
      </div>
      <p className="text-sm">{productSummary(lead, products) || '—'}</p>
      {message && (
        <p className="rounded-md bg-surface-2 px-3 py-2 text-sm text-fg-muted">{message}</p>
      )}
      <p className="text-xs text-fg-subtle">
        {t('inbox.waiting', { time: formatRelative(lead.createdAt) })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={() => void claim()}>
          {t('inbox.claim')}
        </Button>
        {isOwner(user) && (
          <Select
            aria-label={t('inbox.assignTo')}
            className="w-44"
            value=""
            onChange={(e) => void assign(e.target.value)}
            placeholder={t('inbox.assignTo')}
            options={staff.map((u) => ({ value: u.id, label: u.name }))}
          />
        )}
        <a
          href={telLink(lead.phone)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-2"
        >
          <Phone className="size-4" />
          {t('common.call')}
        </a>
        <a
          href={waLink(lead.phone)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-2"
        >
          <MessageCircle className="size-4" />
          {t('common.whatsapp')}
        </a>
      </div>
    </Card>
  )
}

export default function Inbox() {
  const { t } = useTranslation()
  const queue = useUnassigned()
  return (
    <>
      <PageHeader title={t('inbox.title')} description={t('inbox.description')} />
      {queue.length === 0 ? (
        <Card>
          <EmptyState
            icon={InboxIcon}
            title={t('inbox.emptyTitle')}
            description={t('inbox.emptyText')}
          />
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {queue.map((l) => (
            <InboxCard key={l.id} lead={l} />
          ))}
        </div>
      )}
    </>
  )
}
