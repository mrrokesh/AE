import { Mail, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, Badge, Button, Card, Select } from '@/components/ui'
import { LEAD_STAGES, type LostReasonId, type StageId } from '@/constants'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { formatPhone } from '@/lib/format'
import { useCrmStore } from '@/store/crmStore'
import { toast } from '@/store/toastStore'
import type { Lead } from '@/types'
import { assignLead, changeStage, claimLead } from '../actions'
import { leadName } from '../format'
import { openLostReason } from '../openers'
import { telLink, waLink } from '../phone'
import { useTemperature } from '../temperature'
import { whatsappMessage } from '../waMessages'
import { SlaBadge } from './SlaBadge'
import { TemperatureBadge } from './TemperatureBadge'

export function LeadHeader({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { users, products } = useCrmStore()
  const { temperature, closed } = useTemperature(lead)
  const owner = users.find((u) => u.id === lead.assignedTo)

  const setStage = async (stage: StageId, reason?: LostReasonId) => {
    if (!user) return
    try {
      await changeStage(lead.id, stage, user, reason)
      toast.success(t('pipeline.moved', { stage: t(`stages.${stage}`) }))
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={leadName(lead)} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{leadName(lead)}</h1>
            <p className="text-sm text-fg-muted">
              {formatPhone(lead.phone)} · {lead.city}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="info">{t(`sources.${lead.source}`)}</Badge>
          {!closed && <TemperatureBadge temperature={temperature} />}
          <SlaBadge lead={lead} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={telLink(lead.phone)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-success text-base font-semibold text-white hover:opacity-90"
        >
          <Phone className="size-5" />
          {t('common.call')}
        </a>
        <a
          href={waLink(lead.phone, whatsappMessage('followUp', lead, products, user, t))}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-success text-base font-semibold text-success hover:bg-success/10"
        >
          <MessageCircle className="size-5" />
          {t('common.whatsapp')}
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t('leads.col.stage')}
          value={lead.stage}
          onChange={(e) => {
            const s = e.target.value as StageId
            if (s === 'lost') openLostReason((r) => void setStage(s, r))
            else void setStage(s)
          }}
          options={LEAD_STAGES.map((s) => ({ value: s.id, label: t(`stages.${s.id}`) }))}
        />
        <div className="space-y-1">
          <span className="text-xs font-medium text-fg-muted">{t('leads.col.assignee')}</span>
          {isOwner(user) ? (
            <Select
              aria-label={t('leads.col.assignee')}
              value={lead.assignedTo ?? ''}
              onChange={(e) => {
                const target = users.find((u) => u.id === e.target.value)
                if (target && user)
                  void assignLead(lead.id, target, user).then(() =>
                    toast.success(t('inbox.assignedToast', { name: target.name })),
                  )
              }}
              placeholder={t('common.unassigned')}
              options={users
                .filter((u) => u.role === 'staff')
                .map((u) => ({ value: u.id, label: u.name }))}
            />
          ) : owner ? (
            <p className="flex h-9 items-center gap-2 text-sm">
              <Avatar name={owner.name} size="sm" />
              {owner.name}
            </p>
          ) : (
            <Button
              variant="primary"
              onClick={() =>
                user &&
                void claimLead(lead.id, user).then(() =>
                  toast.success(t('inbox.claimedToast', { name: leadName(lead) })),
                )
              }
            >
              {t('inbox.claim')}
            </Button>
          )}
        </div>
      </div>
      {lead.email && (
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <Mail className="size-3.5" />
          {lead.email}
        </p>
      )}
    </Card>
  )
}
