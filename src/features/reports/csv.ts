import type { TFunction } from 'i18next'
import { formatDate } from '@/lib/dates'
import type { User } from '@/types'
import type { Sale } from './sales'

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

/** One row per invoice; UTF-8 BOM so Excel shows Tamil correctly. */
export function salesToCsv(sales: Sale[], users: User[], t: TFunction): string {
  const head = ['date', 'invoice', 'customer', 'products', 'units', 'total', 'staff', 'source'].map(
    (k) => t(`reports.csv.${k}`),
  )
  const body = [...sales]
    .sort((a, b) => b.at - a.at)
    .map((s) => [
      formatDate(new Date(s.at)),
      s.invoiceNo,
      s.customerName,
      s.items.map((i) => `${i.name} x${i.qty}`).join('; '),
      s.units,
      s.total,
      users.find((u) => u.id === s.staffId)?.name ?? t('common.unassigned'),
      s.source ? t(`sources.${s.source}`) : '',
    ])
  return '﻿' + [head, ...body].map((r) => r.map(esc).join(',')).join('\r\n')
}
