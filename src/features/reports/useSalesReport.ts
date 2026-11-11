import { useMemo, useState } from 'react'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { useScopedCustomers } from '@/features/customers/useCustomers'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import { buildSales, buildSalesReport, filterByRange, type RangeId } from './sales'

export function useSalesReport() {
  const products = useCrmStore((s) => s.products)
  const users = useCrmStore((s) => s.users)
  const customers = useScopedCustomers()
  const leads = useScopedLeads()
  const now = useNow()
  const [range, setRange] = useState<RangeId>('30d')
  const all = useMemo(() => buildSales(customers, leads), [customers, leads])
  const sales = useMemo(() => filterByRange(all, range, now), [all, range, now])
  const report = useMemo(
    () => buildSalesReport(sales, products, range, now),
    [sales, products, range, now],
  )
  return { range, setRange, sales, report, users }
}
