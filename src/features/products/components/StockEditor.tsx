import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { toast } from '@/store/toastStore'
import type { Product, StockStatus } from '@/types'
import { STOCK_STATUSES, updateStock, type StockPatch } from '../stock'

const field =
  'h-8 rounded-md border border-border bg-surface px-2 text-xs focus:border-brand-500 focus:outline-2 focus:outline-brand-500/30'

/** Owner-only live stock controls. Saves on change/blur. */
export function StockEditor({ product }: { product: Product }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const [draft, setDraft] = useState<string | null>(null)
  const save = async (patch: StockPatch) => {
    if (!user) return
    try {
      const { waiting } = await updateStock(product, patch, user)
      if (waiting === null) toast.success(t('catalog.stockUpdated', { name: product.name }))
      else if (waiting === 0) toast.success(t('catalog.waitlist.restockNone'))
      else toast.success(t('catalog.waitlist.restockToast', { count: waiting }))
    } catch {
      toast.error(t('errors.generic'))
    }
    setDraft(null)
  }
  const commitQty = () => {
    if (draft === null || draft === '' || Number(draft) === product.stockQty) return setDraft(null)
    void save({ stockQty: Number(draft) })
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        aria-label={t('catalog.qty')}
        value={draft ?? product.stockQty}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitQty}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={`${field} w-16`}
      />
      <select
        aria-label={t('catalog.statusLabel')}
        value={product.stockStatus}
        onChange={(e) => void save({ stockStatus: e.target.value as StockStatus })}
        className={field}
      >
        {STOCK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`catalog.stock.${s}`)}
          </option>
        ))}
      </select>
      {product.stockStatus === 'out_of_stock' && (
        <input
          type="date"
          aria-label={t('catalog.restockDate')}
          value={product.restockEta ?? ''}
          onChange={(e) => void save({ restockEta: e.target.value || null })}
          className={field}
        />
      )}
    </div>
  )
}
