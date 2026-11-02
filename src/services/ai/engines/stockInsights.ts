import { formatINR } from '@/lib/format'
import type { ExplainInput, ExplainOutput } from '../types'
import { reasonText, tr } from './shared'

/** Customer-friendly "why this one" built from the real match/difference data (not generic text). */
export function explainAlternative({
  original,
  alternative: alt,
  budget,
  lang,
}: ExplainInput): ExplainOutput {
  const points = alt.matches
    .filter((m) => m.key !== 'similarPrice')
    .slice(0, 2)
    .map((m) => reasonText(lang, m))
  const caveat = alt.differences[0]
  const parts = [
    points.length
      ? tr(lang, 'ai.alt.explain', {
          alt: alt.product.name,
          points: points.join(tr(lang, 'ai.alt.joiner')),
        })
      : tr(lang, 'ai.alt.explainNone', { alt: alt.product.name, original: original.name }),
  ]
  if (caveat) parts.push(tr(lang, 'ai.alt.caveat', { diff: reasonText(lang, caveat) }))
  if (budget)
    parts.push(
      tr(lang, alt.product.sellingPrice <= budget ? 'ai.alt.fitsBudget' : 'ai.alt.aboveBudget', {
        budget: formatINR(budget),
      }),
    )
  return { text: parts.join(' ') }
}
