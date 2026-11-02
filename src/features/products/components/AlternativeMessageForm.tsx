import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AiThinking } from '@/features/ai/components/AiThinking'
import { useAiTask } from '@/features/ai/useAiTask'
import { useLeadCtx } from '@/features/ai/useLeadCtx'
import { waLink } from '@/features/leads/phone'
import { Button, Textarea } from '@/components/ui'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import type { Product } from '@/types'
import type { Alternative } from '../similarity'

/** Editable out-of-stock WhatsApp draft (English or Tamil) that opens wa.me. */
export function AlternativeMessageForm({
  leadId,
  original,
  alt,
  onDone,
}: {
  leadId: string
  original: Product
  alt: Alternative
  onDone: () => void
}) {
  const { t } = useTranslation()
  const lead = useScopedLeads().find((l) => l.id === leadId)
  if (!lead) return null
  return <Draft lead={lead} original={original} alt={alt} onDone={onDone} t={t} />
}

function Draft({
  lead,
  original,
  alt,
  onDone,
  t,
}: {
  lead: NonNullable<ReturnType<typeof useScopedLeads>[number]>
  original: Product
  alt: Alternative
  onDone: () => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  const ctx = useLeadCtx(lead)
  const draft = useAiTask(
    'draftWhatsAppMessage',
    { ...ctx, kind: 'out_of_stock_alternative', stock: { original, alternative: alt } },
    `${lead.id}|${original.id}|${alt.product.id}|${ctx.lang}`,
  )
  const [edited, setEdited] = useState<string | null>(null)
  const text = edited ?? draft.data?.message ?? ''
  return (
    <div className="space-y-3">
      <p className="text-xs text-fg-muted">{t('catalog.alt.draftHint')}</p>
      {draft.loading ? (
        <AiThinking />
      ) : (
        <Textarea
          label={t('catalog.alt.draftTitle')}
          rows={6}
          value={text}
          onChange={(e) => setEdited(e.target.value)}
        />
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>{t('common.cancel')}</Button>
        <a
          href={waLink(lead.phone, text)}
          target="_blank"
          rel="noreferrer"
          onClick={onDone}
          aria-disabled={!text}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success px-3 text-sm font-medium text-white hover:opacity-90"
        >
          <MessageCircle className="size-4" />
          {t('catalog.alt.openWa')}
        </a>
      </div>
    </div>
  )
}
