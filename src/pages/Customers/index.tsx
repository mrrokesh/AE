import { useMemo, useState } from 'react'
import { Building2, IndianRupee, Repeat, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Card, EmptyState, Input, Select } from '@/components/ui'
import { CustomerDrawer } from '@/features/customers/components/CustomerDrawer'
import { CustomerList } from '@/features/customers/components/CustomerList'
import { customerTotals, filterCustomers, type CustomerSort } from '@/features/customers/filters'
import { useScopedCustomers } from '@/features/customers/useCustomers'
import { formatINRCompact } from '@/lib/format'
import type { Customer } from '@/types'

export default function Customers() {
  const { t } = useTranslation()
  const all = useScopedCustomers()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<CustomerSort>('recent')
  const [open, setOpen] = useState<Customer | null>(null)
  const rows = useMemo(() => filterCustomers(all, search, sort), [all, search, sort])
  const totals = useMemo(() => customerTotals(all), [all])

  return (
    <>
      <PageHeader
        title={t('pages.customers.title')}
        description={t('pages.customers.description')}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('customers.stat.count')} value={String(totals.count)} icon={Building2} />
        <StatCard
          label={t('customers.stat.spent')}
          value={formatINRCompact(totals.spent)}
          icon={IndianRupee}
        />
        <StatCard
          label={t('customers.stat.orders')}
          value={String(totals.orders)}
          icon={ShoppingBag}
        />
        <StatCard label={t('customers.stat.repeat')} value={String(totals.repeat)} icon={Repeat} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-48 flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('customers.search')}
            aria-label={t('customers.search')}
          />
        </div>
        <Select
          aria-label={t('customers.sort.label')}
          value={sort}
          onChange={(e) => setSort(e.target.value as CustomerSort)}
          options={(['recent', 'spent', 'name'] as const).map((id) => ({
            value: id,
            label: t(`customers.sort.${id}`),
          }))}
        />
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t('customers.emptyTitle')}
            description={t('customers.emptyText')}
          />
        ) : (
          <CustomerList rows={rows} onOpen={setOpen} />
        )}
      </Card>
      <CustomerDrawer customer={open} onClose={() => setOpen(null)} />
    </>
  )
}
