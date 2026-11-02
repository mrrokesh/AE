import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar, Select } from '@/components/ui'
import { LEAD_STAGES, type LostReasonId, type StageId } from '@/constants'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/dates'
import { formatINR } from '@/lib/format'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import { toast } from '@/store/toastStore'
import { changeStage } from '../actions'
import type { ScoredLead } from '../filters'
import { bucketOf } from '../followUps'
import { leadName, productSummary } from '../format'
import { openLostReason } from '../openers'
import { SlaBadge } from './SlaBadge'
import { TemperatureBadge } from './TemperatureBadge'

/** Kanban board: drag a card to another column. Dropping on Lost asks for a reason first. */
export function PipelineBoard({ rows }: { rows: ScoredLead[] }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { products, users } = useCrmStore()
  const now = useNow()
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<StageId | null>(null)

  const move = async (leadId: string, stage: StageId, reason?: LostReasonId) => {
    if (!user) return
    try {
      await changeStage(leadId, stage, user, reason)
      toast.success(t('pipeline.moved', { stage: t(`stages.${stage}`) }))
    } catch {
      toast.error(t('errors.generic'))
    }
  }
  const requestMove = (leadId: string, stage: StageId) => {
    const lead = rows.find((r) => r.lead.id === leadId)?.lead
    if (!lead || lead.stage === stage) return
    if (stage === 'lost') openLostReason((reason) => void move(leadId, stage, reason))
    else void move(leadId, stage)
  }

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
      {LEAD_STAGES.map((s) => {
        const cards = rows
          .filter((r) => r.lead.stage === s.id)
          .sort(
            (a, b) =>
              Date.parse(a.lead.nextFollowUpAt ?? '9999') -
              Date.parse(b.lead.nextFollowUpAt ?? '9999'),
          )
        return (
          <section
            key={s.id}
            aria-label={t(`stages.${s.id}`)}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(s.id)
            }}
            onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault()
              setOver(null)
              if (dragId) requestMove(dragId, s.id)
              setDragId(null)
            }}
            className={cn(
              'flex max-h-[calc(100dvh-11rem)] w-72 shrink-0 flex-col rounded-lg border bg-surface-2/60',
              over === s.id ? 'border-brand-500 bg-brand-500/5' : 'border-border',
            )}
          >
            <header className="flex items-center justify-between px-3 py-2.5">
              <h2 className="text-sm font-semibold">{t(`stages.${s.id}`)}</h2>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-fg-muted">
                {cards.length}
              </span>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {cards.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-fg-subtle">
                  {t('pipeline.empty')}
                </p>
              )}
              {cards.map(({ lead, temperature, closed }) => {
                const owner = users.find((u) => u.id === lead.assignedTo)
                return (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setOver(null)
                    }}
                    className={cn(
                      'cursor-grab space-y-2 rounded-lg border border-border bg-surface p-3 shadow-sm active:cursor-grabbing',
                      dragId === lead.id && 'opacity-50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="min-w-0 truncate text-sm font-semibold hover:underline"
                      >
                        {leadName(lead)}
                      </Link>
                      {!closed && <TemperatureBadge temperature={temperature} />}
                    </div>
                    <p className="line-clamp-2 text-xs text-fg-muted">
                      {productSummary(lead, products) || '—'}
                    </p>
                    {lead.budget && <p className="text-xs font-medium">{formatINR(lead.budget)}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                      {lead.nextFollowUpAt ? (
                        <span
                          className={cn(
                            bucketOf(lead, now) === 'overdue'
                              ? 'font-medium text-danger'
                              : 'text-fg-muted',
                          )}
                        >
                          {formatRelative(lead.nextFollowUpAt)}
                        </span>
                      ) : (
                        <SlaBadge lead={lead} />
                      )}
                      {owner ? (
                        <Avatar name={owner.name} size="sm" />
                      ) : (
                        <span className="text-warning">{t('common.unassigned')}</span>
                      )}
                    </div>
                    <Select
                      aria-label={t('pipeline.moveTo')}
                      className="h-8 text-xs md:hidden"
                      value=""
                      onChange={(e) =>
                        e.target.value && requestMove(lead.id, e.target.value as StageId)
                      }
                      placeholder={t('pipeline.moveTo')}
                      options={LEAD_STAGES.filter((x) => x.id !== lead.stage).map((x) => ({
                        value: x.id,
                        label: t(`stages.${x.id}`),
                      }))}
                    />
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
