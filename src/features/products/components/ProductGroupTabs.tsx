import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui'
import { PRODUCT_GROUPS } from '@/constants'
import type { ProductFilters } from '../filters'
import type { useProductBrowser } from '../useProductBrowser'
import { FilterChip } from './FilterChip'

type Browser = ReturnType<typeof useProductBrowser>

/**
 * Level 1: Printers / Speakers / Laptop accessories.
 * Level 2 (only once a section is chosen): that section's own filters
 * (printer type, connectivity, colour; speaker connectivity, waterproof).
 */
export function ProductGroupTabs({
  filters,
  groups,
  types,
  connectivity,
  onChange,
}: {
  filters: ProductFilters
  groups: Browser['groups']
  types: Browser['types']
  connectivity: Browser['connectivity']
  onChange: (patch: Partial<ProductFilters>) => void
}) {
  const { t } = useTranslation()
  const g = filters.group
  const total = Object.values(groups).reduce((s, n) => s + n, 0)
  return (
    <div className="space-y-2.5">
      <div role="tablist" aria-label={t('catalog.group.label')} className="flex flex-wrap gap-1.5">
        <FilterChip
          size="md"
          active={g === ''}
          count={total}
          onClick={() => onChange({ group: '' })}
        >
          {t('catalog.all')}
        </FilterChip>
        {PRODUCT_GROUPS.map((x) => (
          <FilterChip
            key={x.id}
            size="md"
            active={g === x.id}
            count={groups[x.id]}
            onClick={() => onChange({ group: x.id })}
          >
            {t(`catalog.group.${x.id}`)}
          </FilterChip>
        ))}
      </div>

      {g === 'printers' && (
        <div className="space-y-2 rounded-lg border border-border bg-surface-2/50 p-2.5">
          <div
            role="tablist"
            aria-label={t('catalog.filter.type')}
            className="flex flex-wrap gap-1.5"
          >
            <FilterChip active={filters.category === ''} onClick={() => onChange({ category: '' })}>
              {t('catalog.filter.allTypes')}
            </FilterChip>
            {types.map(([id, n]) => (
              <FilterChip
                key={id}
                active={filters.category === id}
                count={n}
                onClick={() => onChange({ category: id })}
              >
                {t(`categories.${id}`)}
              </FilterChip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:max-w-md">
            <ConnectivitySelect filters={filters} options={connectivity} onChange={onChange} />
            <Select
              aria-label={t('catalog.filter.colour')}
              value={filters.color}
              onChange={(e) => onChange({ color: e.target.value as ProductFilters['color'] })}
              placeholder={t('catalog.filter.anyColour')}
              options={[
                { value: 'mono', label: t('catalog.spec.mono') },
                { value: 'color', label: t('catalog.spec.color') },
              ]}
            />
          </div>
        </div>
      )}

      {(g === 'computers' || g === 'accessories') && (
        <div className="space-y-2 rounded-lg border border-border bg-surface-2/50 p-2.5">
          <div
            role="tablist"
            aria-label={t(g === 'computers' ? 'catalog.filter.computerType' : 'catalog.filter.accessoryType')}
            className="flex flex-wrap gap-1.5"
          >
            <FilterChip active={filters.category === ''} onClick={() => onChange({ category: '' })}>
              {t('catalog.filter.allTypes')}
            </FilterChip>
            {types.map(([id, n]) => (
              <FilterChip
                key={id}
                active={filters.category === id}
                count={n}
                onClick={() => onChange({ category: id })}
              >
                {t(`categories.${id}`)}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      {g === 'speakers' && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2/50 p-2.5">
          <div className="w-40">
            <ConnectivitySelect filters={filters} options={connectivity} onChange={onChange} />
          </div>
          <FilterChip
            active={filters.waterproof}
            onClick={() => onChange({ waterproof: !filters.waterproof })}
          >
            {t('catalog.spec.waterproof')}
          </FilterChip>
        </div>
      )}
    </div>
  )
}

function ConnectivitySelect({
  filters,
  options,
  onChange,
}: {
  filters: ProductFilters
  options: Browser['connectivity']
  onChange: (patch: Partial<ProductFilters>) => void
}) {
  const { t } = useTranslation()
  return (
    <Select
      aria-label={t('catalog.filter.connectivity')}
      value={filters.connectivity}
      onChange={(e) => onChange({ connectivity: e.target.value })}
      placeholder={t('catalog.filter.anyConnectivity')}
      options={options.map(([c, n]) => ({
        value: c,
        label: `${t(`catalog.conn.${c}`, c)} (${n})`,
      }))}
    />
  )
}
