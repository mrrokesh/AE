import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import type { RowSelectionState, SortingState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { Button, Card, EmptyState } from '@/components/ui'
import { BulkBar } from '@/features/leads/components/BulkBar'
import { LeadFilterBar } from '@/features/leads/components/LeadFilterBar'
import { LeadsTable } from '@/features/leads/components/LeadsTable'
import { downloadCsv, leadsToCsv } from '@/features/leads/csv'
import {
  EMPTY_FILTERS,
  filterLeads,
  filtersFromParams,
  filtersToParams,
  type LeadFilters,
} from '@/features/leads/filters'
import { useScoredLeads } from '@/features/leads/useLeadRows'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'

export default function Leads() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { products, users } = useCrmStore()
  const all = useScoredLeads()
  const now = useNow()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created', desc: true }])
  const [selection, setSelection] = useState<RowSelectionState>({})

  const filters = filtersFromParams(params)
  const rows = useMemo(
    () => filterLeads(all, filtersFromParams(params), products, now),
    [all, params, products, now],
  )
  const ids = Object.keys(selection).filter((k) => selection[k])

  const change = (patch: Partial<LeadFilters>) =>
    setParams(filtersToParams({ ...filters, ...patch }), { replace: true })
  const exportCsv = () => {
    const chosen = ids.length ? rows.filter((r) => ids.includes(r.lead.id)) : rows
    downloadCsv(
      `anita-leads-${new Date().toISOString().slice(0, 10)}.csv`,
      leadsToCsv(chosen, products, users, t),
    )
  }

  return (
    <>
      <PageHeader
        title={t('leads.title')}
        description={t('leads.description', { count: all.length })}
        actions={
          <Button onClick={exportCsv}>
            <Download className="size-4" />
            <span className="hidden sm:inline">{t('leads.export')}</span>
          </Button>
        }
      />
      <LeadFilterBar
        filters={filters}
        onChange={change}
        onClear={() => setParams(filtersToParams(EMPTY_FILTERS), { replace: true })}
      />
      <BulkBar ids={ids} onClear={() => setSelection({})} onExport={exportCsv} />
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('leads.emptyTitle')}
            description={t('leads.emptyText')}
          />
        ) : (
          <LeadsTable
            rows={rows}
            sorting={sorting}
            onSortingChange={setSorting}
            selection={selection}
            onSelectionChange={setSelection}
          />
        )}
      </Card>
    </>
  )
}
