import { Check, MessageCircle, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AiThinking } from '@/features/ai/components/AiThinking'
import { Typewriter } from '@/features/ai/components/Typewriter'
import { useAiTask } from '@/features/ai/useAiTask'
import { useLang } from '@/features/ai/useLeadCtx'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatINR } from '@/lib/format'
import type { Product } from '@/types'
import { confidenceLevel, type Alternative, type SimReason } from '../similarity'
import { ProductImage } from './ProductImage'
import { StockBadge } from './StockBadge'

const TONE = {
  good: 'bg-success/10 text-success',
  bad: 'bg-warning/15 text-warning',
  neutral: 'bg-surface-2 text-fg-muted',
} as const

export function ReasonChips({ items }: { items: SimReason[] }) {
  const { t } = useTranslation()
  return (
    <ul className="flex flex-wrap gap-1">
      {items.map((r) => (
        <li
          key={r.key}
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[11px] first-letter:uppercase',
            TONE[r.tone],
          )}
        >
          {t(`catalog.sim.${r.key}`, r.params)}
        </li>
      ))}
    </ul>
  )
}

interface Props {
  original: Product
  alt: Alternative
  budget: number | null
  added: boolean
  onAdd?: () => void
  onWhatsApp?: () => void
}

/** One closest-match suggestion: why it fits, what differs, and one-tap actions. */
export function AlternativeCard({ original, alt, budget, added, onAdd, onWhatsApp }: Props) {
  const { t } = useTranslation()
  const lang = useLang()
  const p = alt.product
  const why = useAiTask(
    'explainAlternative',
    { original, alternative: alt, budget, lang },
    `${original.id}|${p.id}|${lang}|${budget}|${p.stockStatus}`,
  )
  return (
    <article className="space-y-2.5 rounded-lg border border-border bg-surface p-3">
      <div className="flex gap-3">
        <ProductImage
          src={p.images[0]}
          alt={p.name}
          className="size-16 shrink-0 rounded-md border border-border"
        />
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm leading-snug font-semibold">{p.name}</h4>
          <p className="mt-0.5 text-sm">
            <span className="font-semibold">{formatINR(p.sellingPrice)}</span>
            {p.mrp > p.sellingPrice && (
              <span className="ml-1.5 text-xs text-fg-subtle line-through">{formatINR(p.mrp)}</span>
            )}
          </p>
          <StockBadge product={p} />
        </div>
        <div className="shrink-0 text-right">
          <Badge tone={alt.score >= 75 ? 'success' : alt.score >= 55 ? 'info' : 'neutral'}>
            {t('catalog.sim.matchPct', { pct: alt.score })}
          </Badge>
          <p className="mt-1 max-w-24 text-[10px] leading-tight text-fg-subtle">
            {t(`catalog.sim.confidence.${confidenceLevel(alt.confidence)}`)}
          </p>
        </div>
      </div>
      <ReasonChips items={[...alt.matches, ...alt.differences]} />
      <p className="min-h-4 text-xs text-fg-muted">
        {why.loading || !why.data ? (
          <AiThinking />
        ) : (
          <Typewriter key={why.data.text} text={why.data.text} />
        )}
      </p>
      {(onAdd || onWhatsApp) && (
        <div className="flex flex-wrap gap-2">
          {onAdd && (
            <Button variant={added ? 'secondary' : 'primary'} disabled={added} onClick={onAdd}>
              {added ? <Check className="size-4" /> : <Plus className="size-4" />}
              {added ? t('catalog.alt.added') : t('catalog.alt.add')}
            </Button>
          )}
          {onWhatsApp && (
            <Button onClick={onWhatsApp}>
              <MessageCircle className="size-4 text-success" />
              {t('catalog.alt.whatsapp')}
            </Button>
          )}
        </div>
      )}
    </article>
  )
}
