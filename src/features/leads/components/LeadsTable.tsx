import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { StageBadge } from '@/components/StageBadge'
import { Avatar, Badge, Select, Table, TBody, Td, Th, THead, Tr } from '@/components/ui'
import { LEAD_STAGES } from '@/constants'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/dates'
import { formatPhone } from '@/lib/format'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import type { ScoredLead } from '../filters'
import { bucketOf } from '../followUps'
import { leadName, productSummary } from '../format'
import { SlaBadge } from './SlaBadge'
import { TemperatureBadge } from './TemperatureBadge'

type Row = ScoredLead

const ts = (v: string | null) => (v ? Date.parse(v) : Number.MAX_SAFE_INTEGER)
const SORTABLE = ['name', 'stage', 'temperature', 'nextFollowUp', 'lastContacted', 'created']

interface Props {
  rows: Row[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  selection: RowSelectionState
  onSelectionChange: OnChangeFn<RowSelectionState>
}

export function LeadsTable({
  rows,
  sorting,
  onSortingChange,
  selection,
  onSelectionChange,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { products, users } = useCrmStore()
  const now = useNow()
  const userName = (id: string | null) => users.find((u) => u.id === id)?.name

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: 'select',
        enableSorting: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label={t('leads.selectAll')}
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={t('leads.selectRow')}
            checked={row.getIsSelected()}
            onClick={(e) => e.stopPropagation()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        id: 'name',
        header: t('leads.col.name'),
        accessorFn: (r) => leadName(r.lead).toLowerCase(),
        cell: ({ row }) => (
          <div className="min-w-40">
            <Link
              to={`/leads/${row.original.lead.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:underline"
            >
              {leadName(row.original.lead)}
            </Link>
            <p className="text-xs text-fg-muted">
              {formatPhone(row.original.lead.phone)} · {row.original.lead.city}
            </p>
          </div>
        ),
      },
      {
        id: 'stage',
        header: t('leads.col.stage'),
        accessorFn: (r) => LEAD_STAGES.findIndex((s) => s.id === r.lead.stage),
        cell: ({ row }) => <StageBadge stage={row.original.lead.stage} />,
      },
      {
        id: 'temperature',
        header: t('leads.col.temperature'),
        accessorFn: (r) => (r.closed ? -1 : r.score),
        cell: ({ row }) =>
          row.original.closed ? (
            <span className="text-fg-subtle">—</span>
          ) : (
            <TemperatureBadge temperature={row.original.temperature} />
          ),
      },
      {
        id: 'source',
        header: t('leads.col.source'),
        enableSorting: false,
        cell: ({ row }) => <Badge tone="info">{t(`sources.${row.original.lead.source}`)}</Badge>,
      },
      {
        id: 'product',
        header: t('leads.col.product'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-56 text-xs">
            {productSummary(row.original.lead, products) || '—'}
          </span>
        ),
      },
      {
        id: 'assignee',
        header: t('leads.col.assignee'),
        enableSorting: false,
        cell: ({ row }) => {
          const name = userName(row.original.lead.assignedTo)
          return name ? (
            <span className="flex items-center gap-1.5 text-xs">
              <Avatar name={name} size="sm" />
              {name.split(' ')[0]}
            </span>
          ) : (
            <Badge tone="warning">{t('common.unassigned')}</Badge>
          )
        },
      },
      {
        id: 'nextFollowUp',
        header: t('leads.col.nextFollowUp'),
        accessorFn: (r) => ts(r.lead.nextFollowUpAt),
        cell: ({ row }) => {
          const l = row.original.lead
          return l.nextFollowUpAt ? (
            <span
              className={cn(
                'text-xs whitespace-nowrap',
                bucketOf(l, now) === 'overdue' && 'font-medium text-danger',
              )}
            >
              {formatRelative(l.nextFollowUpAt)}
            </span>
          ) : (
            <SlaBadge lead={l} />
          )
        },
      },
      {
        id: 'lastContacted',
        header: t('leads.col.lastContacted'),
        accessorFn: (r) => -ts(r.lead.lastContactedAt),
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap text-fg-muted">
            {row.original.lead.lastContactedAt
              ? formatRelative(row.original.lead.lastContactedAt)
              : '—'}
          </span>
        ),
      },
      {
        id: 'created',
        header: t('leads.col.created'),
        accessorFn: (r) => Date.parse(r.lead.createdAt),
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap text-fg-muted">
            {formatRelative(row.original.lead.createdAt)}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, products, users, now],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, rowSelection: selection },
    onSortingChange,
    onRowSelectionChange: onSelectionChange,
    getRowId: (r) => r.lead.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })
  const pageRows = table.getRowModel().rows
  const { pageIndex, pageSize } = table.getState().pagination
  const total = rows.length

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <THead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <Th
                    key={h.id}
                    aria-sort={
                      h.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : h.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {h.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-fg"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : h.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </Th>
                ))}
              </tr>
            ))}
          </THead>
          <TBody>
            {pageRows.map((r) => (
              <Tr
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(`/leads/${r.original.lead.id}`)}
              >
                {r.getVisibleCells().map((c) => (
                  <Td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</Td>
                ))}
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>

      <div className="space-y-2 p-2 md:hidden">
        <Select
          aria-label={t('leads.sortBy')}
          value={sorting[0]?.id ?? ''}
          onChange={(e) =>
            onSortingChange(e.target.value ? [{ id: e.target.value, desc: false }] : [])
          }
          placeholder={t('leads.sortBy')}
          options={SORTABLE.map((id) => ({ value: id, label: t(`leads.col.${id}`) }))}
        />
        {pageRows.map((r) => {
          const { lead, temperature, closed } = r.original
          return (
            <Link
              key={r.id}
              to={`/leads/${lead.id}`}
              className="block space-y-2 rounded-lg border border-border p-3 active:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{leadName(lead)}</p>
                  <p className="text-xs text-fg-muted">
                    {formatPhone(lead.phone)} · {lead.city}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StageBadge stage={lead.stage} />
                  {!closed && <TemperatureBadge temperature={temperature} />}
                </div>
              </div>
              <p className="text-xs text-fg-muted">{productSummary(lead, products) || '—'}</p>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span
                  className={cn(
                    bucketOf(lead, now) === 'overdue' ? 'font-medium text-danger' : 'text-fg-muted',
                  )}
                >
                  {lead.nextFollowUpAt ? formatRelative(lead.nextFollowUpAt) : ''}
                </span>
                <SlaBadge lead={lead} />
                <span className="text-fg-muted">
                  {userName(lead.assignedTo)?.split(' ')[0] ?? t('common.unassigned')}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-xs text-fg-muted">
        <span>
          {t('leads.showing', {
            from: total === 0 ? 0 : pageIndex * pageSize + 1,
            to: Math.min(total, (pageIndex + 1) * pageSize),
            total,
          })}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="h-8 rounded-md border border-border px-3 disabled:opacity-40"
          >
            {t('leads.prev')}
          </button>
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="h-8 rounded-md border border-border px-3 disabled:opacity-40"
          >
            {t('leads.next')}
          </button>
        </div>
      </div>
    </>
  )
}
