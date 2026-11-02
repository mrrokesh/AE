import { useState } from 'react'
import { Filter, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Select } from '@/components/ui'
import { LEAD_SOURCES, LEAD_STAGES, TEMPERATURES } from '@/constants'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useCrmStore } from '@/store/crmStore'
import { activeFilterCount, type LeadFilters } from '../filters'

export function LeadFilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: LeadFilters
  onChange: (patch: Partial<LeadFilters>) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { products, users } = useCrmStore()
  const [open, setOpen] = useState(false)
  const count = activeFilterCount(filters)
  const set = (k: keyof LeadFilters) => (e: { target: { value: string } }) =>
    onChange({ [k]: e.target.value })

  return (
    <div className="mb-3 space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            value={filters.q}
            onChange={set('q')}
            aria-label={t('leads.searchLabel')}
            placeholder={t('leads.searchPlaceholder')}
            className="h-9 w-full rounded-md border border-border bg-surface pr-3 pl-8 text-sm placeholder:text-fg-subtle focus:border-brand-500 focus:outline-2 focus:outline-brand-500/30"
          />
        </div>
        <Button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="lg:hidden">
          <Filter className="size-4" />
          {t('leads.filters')}
          {count > 0 && ` (${count})`}
        </Button>
        {count + (filters.q ? 1 : 0) > 0 && (
          <Button variant="ghost" onClick={onClear}>
            <X className="size-4" />
            <span className="hidden sm:inline">{t('common.clear')}</span>
          </Button>
        )}
      </div>
      <div
        className={`${open ? 'grid' : 'hidden'} grid-cols-2 gap-2 sm:grid-cols-3 lg:grid lg:grid-cols-4 xl:grid-cols-8`}
      >
        <Select
          aria-label={t('leads.col.stage')}
          value={filters.stage}
          onChange={set('stage')}
          placeholder={t('leads.allStages')}
          options={LEAD_STAGES.map((s) => ({ value: s.id, label: t(`stages.${s.id}`) }))}
        />
        <Select
          aria-label={t('leads.col.source')}
          value={filters.source}
          onChange={set('source')}
          placeholder={t('leads.allSources')}
          options={LEAD_SOURCES.map((s) => ({ value: s.id, label: t(`sources.${s.id}`) }))}
        />
        {isOwner(user) && (
          <Select
            aria-label={t('leads.col.assignee')}
            value={filters.assignee}
            onChange={set('assignee')}
            placeholder={t('leads.allAssignees')}
            options={[
              { value: 'unassigned', label: t('common.unassigned') },
              ...users
                .filter((u) => u.role === 'staff')
                .map((u) => ({ value: u.id, label: u.name })),
            ]}
          />
        )}
        <Select
          aria-label={t('leads.col.product')}
          value={filters.product}
          onChange={set('product')}
          placeholder={t('leads.allProducts')}
          options={products.map((p) => ({ value: p.id, label: p.name }))}
        />
        <Select
          aria-label={t('leads.col.temperature')}
          value={filters.temp}
          onChange={set('temp')}
          placeholder={t('leads.allTemps')}
          options={TEMPERATURES.map((x) => ({ value: x, label: t(`temperature.${x}`) }))}
        />
        <Input
          aria-label={t('leads.from')}
          title={t('leads.from')}
          type="date"
          value={filters.from}
          onChange={set('from')}
        />
        <Input
          aria-label={t('leads.to')}
          title={t('leads.to')}
          type="date"
          value={filters.to}
          onChange={set('to')}
        />
        <Select
          aria-label={t('leads.bucket')}
          value={filters.bucket}
          onChange={set('bucket')}
          placeholder={t('leads.anyFollowUp')}
          options={['overdue', 'today', 'upcoming'].map((b) => ({
            value: b,
            label: t(`followUps.tabs.${b}`),
          }))}
        />
      </div>
    </div>
  )
}
