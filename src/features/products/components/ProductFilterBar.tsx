import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui'
import { PRODUCT_CATEGORIES } from '@/constants'
import { cn } from '@/lib/cn'
import type { ProductFilters, ProductSort } from '../filters'
import type { stockCounts } from '../filters'

type Counts = ReturnType<typeof stockCounts>
const STOCK_TABS = ['', 'in_stock', 'low', 'out_of_stock'] as const

export function ProductFilterBar({
  filters,
  brands,
  counts,
  onChange,
}: {
  filters: ProductFilters
  brands: string[]
  counts: Counts
  onChange: (patch: Partial<ProductFilters>) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="mb-4 space-y-3">
      <div role="tablist" aria-label={t('catalog.statusLabel')} className="flex flex-wrap gap-1.5">
        {STOCK_TABS.map((s) => (
          <button
            key={s || 'all'}
            role="tab"
            aria-selected={filters.stock === s}
            onClick={() => onChange({ stock: s })}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium',
              filters.stock === s
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-border hover:bg-surface-2',
            )}
          >
            {s ? t(`catalog.stock.${s}`) : t('catalog.all')} · {counts[s || 'all']}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="relative col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            aria-label={t('catalog.search')}
            placeholder={t('catalog.search')}
            className="h-9 w-full rounded-md border border-border bg-surface pr-3 pl-8 text-sm placeholder:text-fg-subtle focus:border-brand-500 focus:outline-2 focus:outline-brand-500/30"
          />
        </div>
        <Select
          aria-label={t('catalog.col.category')}
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
          placeholder={t('catalog.allCategories')}
          options={PRODUCT_CATEGORIES.filter((c) => c.id !== 'accessory').map((c) => ({
            value: c.id,
            label: t(`categories.${c.id}`),
          }))}
        />
        <Select
          aria-label={t('catalog.brand')}
          value={filters.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          placeholder={t('catalog.allBrands')}
          options={brands.map((b) => ({ value: b, label: b }))}
        />
        <Select
          aria-label={t('catalog.sort.label')}
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as ProductSort })}
          options={(['featured', 'priceAsc', 'priceDesc'] as const).map((v) => ({
            value: v,
            label: t(`catalog.sort.${v}`),
          }))}
        />
      </div>
    </div>
  )
}
