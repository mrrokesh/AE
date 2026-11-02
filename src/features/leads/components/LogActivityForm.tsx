import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Select, Textarea } from '@/components/ui'
import { LOST_REASONS, OPEN_STAGES, type LostReasonId, type StageId } from '@/constants'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { tomorrowAt11 } from '@/lib/dates'
import { cn } from '@/lib/cn'
import { useCrmStore } from '@/store/crmStore'
import { useNow } from '@/store/clockStore'
import { toast } from '@/store/toastStore'
import { oosInterest } from '@/features/products/alternatives'
import { OutOfStockLostPrompt } from '@/features/products/components/OutOfStockLostPrompt'
import { logActivity, type LogActivityInput } from '../actions'
import { leadName } from '../format'
import { FollowUpPicker } from './FollowUpPicker'

type Kind = LogActivityInput['type']
type NextKind = 'followUp' | 'won' | 'lost'

const TYPES: Kind[] = ['call', 'whatsapp', 'visit', 'note']
const OUTCOMES: Record<Kind, string[]> = {
  call: ['act.spoke', 'act.noAnswer', 'act.priceAsked', 'act.callBackLater', 'act.negotiating'],
  whatsapp: ['act.sentPrices', 'act.priceAsked', 'act.spoke'],
  visit: ['act.visitedStore', 'act.negotiating', 'act.priceAsked'],
  note: [],
}

/** Log a touch. Cannot be saved without a next action: a follow-up date, or Won/Lost. */
export function LogActivityForm({
  leadId,
  defaultType = 'call',
  onDone,
}: {
  leadId: string
  defaultType?: Kind
  onDone: () => void
}) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const lead = useCrmStore((s) => s.leads.find((l) => l.id === leadId))
  const [type, setType] = useState<Kind>(defaultType)
  const [outcome, setOutcome] = useState('')
  const [text, setText] = useState('')
  const [nextKind, setNextKind] = useState<NextKind | null>(null)
  const [at, setAt] = useState<string | null>(tomorrowAt11().toISOString())
  const [reason, setReason] = useState<LostReasonId | ''>('')
  const [stage, setStage] = useState<StageId | ''>('')
  const now = useNow()
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)
  const [stockPrompt, setStockPrompt] = useState(false)
  const products = useCrmStore((st) => st.products)
  if (!lead || !user) return null
  if (stockPrompt)
    return (
      <OutOfStockLostPrompt
        lead={lead}
        onClose={onDone}
        onLostAnyway={() => {
          setStockPrompt(false)
          void save(true)
        }}
        onWaitlisted={async (updated) => {
          // Keep the lead open: log the touch with the restock follow-up as the next action.
          await logActivity(
            {
              leadId,
              type,
              outcomeKey: outcome || undefined,
              text,
              stage: stage || undefined,
              next: { kind: 'followUp', at: updated.nextFollowUpAt! },
            },
            user,
          )
          onDone()
        }}
      />
    )

  const nextOk =
    nextKind === 'won' ||
    (nextKind === 'lost' && !!reason) ||
    (nextKind === 'followUp' && !!at && Date.parse(at) > now - 60_000)

  const save = async (skipStockCheck = false) => {
    setTouched(true)
    if (!nextOk || !nextKind) return
    if (
      !skipStockCheck &&
      nextKind === 'lost' &&
      reason === 'out_of_stock' &&
      lead &&
      oosInterest(lead, products).length > 0
    )
      return setStockPrompt(true)
    setSaving(true)
    try {
      await logActivity(
        {
          leadId,
          type,
          outcomeKey: outcome || undefined,
          text,
          stage: stage || undefined,
          next:
            nextKind === 'followUp'
              ? { kind: 'followUp', at: at! }
              : nextKind === 'won'
                ? { kind: 'won' }
                : { kind: 'lost', reason: reason as LostReasonId },
        },
        user,
      )
      toast.success(t('logActivity.saved'))
      onDone()
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  const NEXT: { id: NextKind; label: string }[] = [
    { id: 'followUp', label: t('logActivity.next.followUp') },
    { id: 'won', label: t('logActivity.next.won') },
    { id: 'lost', label: t('logActivity.next.lost') },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">{leadName(lead)}</p>
      <div role="tablist" className="grid grid-cols-4 gap-1 rounded-lg bg-surface-2 p-0.5">
        {TYPES.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={type === k}
            onClick={() => {
              setType(k)
              setOutcome('')
            }}
            className={cn(
              'rounded-md px-2 py-1.5 text-sm font-medium',
              type === k ? 'bg-surface shadow-sm' : 'text-fg-muted',
            )}
          >
            {t(`activityTypes.${k}`)}
          </button>
        ))}
      </div>
      {OUTCOMES[type].length > 0 && (
        <Select
          label={t('logActivity.outcome')}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder={t('logActivity.chooseOutcome')}
          options={OUTCOMES[type].map((k) => ({ value: k, label: t(k) }))}
        />
      )}
      <Textarea
        label={t('logActivity.note')}
        placeholder={t('logActivity.notePlaceholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
      />

      <fieldset
        className={cn(
          'space-y-3 rounded-lg border p-3',
          touched && !nextOk ? 'border-danger bg-danger/5' : 'border-border',
        )}
      >
        <legend className="px-1 text-sm font-semibold">{t('logActivity.next.title')}</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {NEXT.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-pressed={nextKind === n.id}
              onClick={() => setNextKind(n.id)}
              className={cn(
                'h-9 rounded-md border text-sm font-medium',
                nextKind === n.id
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'border-border text-fg-muted hover:bg-surface-2',
              )}
            >
              {n.label}
            </button>
          ))}
        </div>
        {nextKind === 'followUp' && (
          <>
            <FollowUpPicker value={at} onChange={setAt} />
            <Select
              label={t('logActivity.stage')}
              value={stage}
              onChange={(e) => setStage(e.target.value as StageId)}
              placeholder={t('logActivity.keepStage')}
              options={OPEN_STAGES.map((s) => ({ value: s, label: t(`stages.${s}`) }))}
            />
          </>
        )}
        {nextKind === 'lost' && (
          <Select
            label={t('lost.reason')}
            value={reason}
            onChange={(e) => setReason(e.target.value as LostReasonId)}
            placeholder={t('lost.choose')}
            options={LOST_REASONS.map((r) => ({ value: r.id, label: t(`lostReasons.${r.id}`) }))}
          />
        )}
        {touched && !nextOk && (
          <p className="text-xs font-medium text-danger">{t('logActivity.next.required')}</p>
        )}
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>{t('common.cancel')}</Button>
        <Button variant="primary" loading={saving} onClick={() => void save()}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
