import { useState } from 'react'
import { Clock, Copy, MessageCircle, RefreshCw, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TemperatureBadge } from '@/features/leads/components/TemperatureBadge'
import { Button, Card, Select } from '@/components/ui'
import { formatINR } from '@/lib/format'
import { waLink } from '@/features/leads/phone'
import { WA_KINDS, type WaKind } from '@/features/leads/waMessages'
import { toast } from '@/store/toastStore'
import { useCrmStore } from '@/store/crmStore'
import type { Lead } from '@/types'
import { useAiTask } from '../useAiTask'
import { useLeadCtx } from '../useLeadCtx'
import { AiThinking } from './AiThinking'
import { Typewriter } from './Typewriter'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1.5 border-t border-border pt-3 first:border-0 first:pt-0">
    <h3 className="text-xs font-medium text-fg-muted">{title}</h3>
    {children}
  </div>
)

export function LeadAiPanel({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const ctx = useLeadCtx(lead)
  const products = useCrmStore((s) => s.products)
  const [kind, setKind] = useState<WaKind>('followUp')
  const key = `${lead.id}|${lead.updatedAt}|${ctx.lang}`

  const score = useAiTask('scoreLead', ctx, key)
  const next = useAiTask('suggestNextAction', ctx, key)
  const rec = useAiTask('recommendProducts', ctx, key)
  const draft = useAiTask('draftWhatsAppMessage', { ...ctx, kind }, `${key}|${kind}`)
  const failed = score.error || next.error || draft.error

  const copy = async () => {
    if (!draft.data) return
    try {
      await navigator.clipboard.writeText(draft.data.message)
      toast.success(t('aiPanel.copied'))
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-brand-600" />
          {t('aiPanel.title')}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('aiPanel.regenerate')}
          onClick={() => {
            score.rerun()
            next.rerun()
            rec.rerun()
            draft.rerun()
          }}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t('aiPanel.failed')}
        </p>
      )}

      <Section title={t('aiPanel.score')}>
        {score.loading || !score.data ? (
          <AiThinking />
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">{score.data.score}</span>
              {score.data.label !== 'closed' && <TemperatureBadge temperature={score.data.label} />}
            </div>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-fg-muted">
              {score.data.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title={t('aiPanel.nextAction')}>
        {next.loading || !next.data ? (
          <AiThinking />
        ) : (
          <>
            <p className="text-sm">
              <Typewriter key={next.data.action} text={next.data.action} />
            </p>
            <p className="flex items-center gap-1.5 text-xs text-fg-muted">
              <Clock className="size-3.5" />
              {t('aiPanel.bestTime')}: <b>{next.data.bestTime}</b>
            </p>
          </>
        )}
      </Section>

      <Section title={t('aiPanel.draft')}>
        <Select
          aria-label={t('aiPanel.draftKind')}
          value={kind}
          onChange={(e) => setKind(e.target.value as WaKind)}
          options={WA_KINDS.map((k) => ({ value: k, label: t(`aiPanel.kind.${k}`) }))}
        />
        {draft.loading || !draft.data ? (
          <AiThinking />
        ) : (
          <>
            <p className="rounded-md bg-surface-2 p-2.5 text-sm">
              <Typewriter key={draft.data.message} text={draft.data.message} />
            </p>
            <div className="flex gap-2">
              <Button onClick={() => void copy()}>
                <Copy className="size-4" />
                {t('aiPanel.copy')}
              </Button>
              <a
                href={waLink(lead.phone, draft.data.message)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-success px-3 text-sm font-medium text-success hover:bg-success/10"
              >
                <MessageCircle className="size-4" />
                {t('aiPanel.open')}
              </a>
            </div>
          </>
        )}
      </Section>

      <Section title={t('aiPanel.recommend')}>
        {rec.loading || !rec.data ? (
          <AiThinking />
        ) : rec.data.items.length === 0 ? (
          <p className="text-xs text-fg-muted">{t('aiPanel.none')}</p>
        ) : (
          <ul className="space-y-2">
            {rec.data.items.map((i) => {
              const p = products.find((x) => x.id === i.productId)
              return p ? (
                <li key={i.productId} className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{p.name}</span>
                    <br />
                    <span className="text-xs text-fg-muted">{i.reason}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatINR(p.sellingPrice)}</span>
                </li>
              ) : null
            })}
          </ul>
        )}
      </Section>
      <p className="text-[11px] text-fg-subtle">{t('aiPanel.mock')}</p>
    </Card>
  )
}
