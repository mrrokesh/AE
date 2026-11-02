import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatINR } from '@/lib/format'
import type { Product } from '@/types'

/** Searchable multi-select over the Products catalog. */
export function ProductPicker({
  products,
  value,
  onChange,
  label,
}: {
  products: Product[]
  value: string[]
  onChange: (ids: string[]) => void
  label?: string
}) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return []
    return products
      .filter(
        (p) =>
          !value.includes(p.id) &&
          `${p.name} ${p.brand} ${p.category} ${t(`categories.${p.category}`)}`
            .toLowerCase()
            .includes(query),
      )
      .slice(0, 6)
  }, [q, products, value, t])

  return (
    <div className="space-y-1">
      {label && <span className="text-xs font-medium text-fg-muted">{label}</span>}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const p = products.find((x) => x.id === id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 py-1 pr-1.5 pl-2.5 text-xs text-brand-700 dark:text-brand-300"
              >
                {p?.name ?? id}
                <button
                  type="button"
                  aria-label={t('common.clear')}
                  onClick={() => onChange(value.filter((v) => v !== id))}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            )
          })}
        </div>
      )}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('products.searchPlaceholder')}
        aria-label={label ?? t('products.searchPlaceholder')}
        className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm placeholder:text-fg-subtle focus:border-brand-500 focus:outline-2 focus:outline-brand-500/30"
      />
      {q.trim() && (
        <ul className="max-h-48 overflow-y-auto rounded-md border border-border bg-surface">
          {results.length === 0 && (
            <li className="px-3 py-2 text-xs text-fg-muted">{t('products.noMatch')}</li>
          )}
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onChange([...value, p.id])
                  setQ('')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                <Plus className="size-3.5 shrink-0 text-fg-subtle" />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="text-xs text-fg-muted">{formatINR(p.sellingPrice)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
