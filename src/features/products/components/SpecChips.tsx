import { useTranslation } from 'react-i18next'
import type { Product } from '@/types'
import { specChips } from '../specs'

export function SpecChips({ product, max = 5 }: { product: Product; max?: number }) {
  const { t } = useTranslation()
  const chips = specChips(product, t)
  if (chips.length === 0)
    return <span className="text-xs text-fg-subtle">{t('catalog.noSpecs')}</span>
  return (
    <ul className="flex flex-wrap gap-1">
      {chips.slice(0, max).map((c) => (
        <li key={c} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-fg-muted">
          {c}
        </li>
      ))}
      {chips.length > max && (
        <li className="px-1 text-[11px] text-fg-subtle">+{chips.length - max}</li>
      )}
    </ul>
  )
}
