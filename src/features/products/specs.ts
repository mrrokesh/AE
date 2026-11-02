import type { TFunction } from 'i18next'
import type { Product } from '@/types'

/** Short, translated spec chips for a product. Unknown (null) specs are skipped, never guessed. */
export function specChips(p: Product, t: TFunction): string[] {
  const s = p.specs
  const out: string[] = []
  if (s.printWidth) out.push(t('catalog.spec.printWidth', { v: s.printWidth }))
  if (s.speed) out.push(`${s.speed.value} ${s.speed.unit}`)
  if (s.resolution) out.push(s.resolution)
  if (s.color) out.push(t(s.color === 'color' ? 'catalog.spec.color' : 'catalog.spec.mono'))
  if (s.autoCutter) out.push(t('catalog.spec.autoCutter'))
  if (s.duty) out.push(t('catalog.spec.duty', { v: s.duty.toLocaleString('en-IN') }))
  if (s.watts) out.push(t('catalog.spec.watts', { v: s.watts }))
  if (s.batteryHours) out.push(t('catalog.spec.battery', { v: s.batteryHours }))
  if (s.waterproof)
    out.push(s.waterproof === 'Waterproof' ? t('catalog.spec.waterproof') : s.waterproof)
  for (const c of s.connectivity ?? []) out.push(t(`catalog.conn.${c}`))
  return out
}
