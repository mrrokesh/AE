import type { TFunction } from 'i18next'
import { formatDateTime } from '@/lib/dates'
import type { Product, User } from '@/types'
import type { ScoredLead } from './filters'
import { leadName, productSummary } from './format'

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

/** UTF-8 CSV with BOM so Excel shows Tamil text correctly. */
export function leadsToCsv(
  rows: ScoredLead[],
  products: Product[],
  users: User[],
  t: TFunction,
): string {
  const keys = [
    'name',
    'phone',
    'city',
    'stage',
    'temperature',
    'source',
    'product',
    'assignee',
    'nextFollowUp',
    'lastContacted',
    'created',
  ]
  const head = keys.map((k) => t(`leads.col.${k}`))
  const body = rows.map(({ lead, temperature, closed }) => [
    leadName(lead),
    lead.phone,
    lead.city,
    t(`stages.${lead.stage}`),
    closed ? '' : t(`temperature.${temperature}`),
    t(`sources.${lead.source}`),
    productSummary(lead, products),
    users.find((u) => u.id === lead.assignedTo)?.name ?? t('common.unassigned'),
    formatDateTime(lead.nextFollowUpAt),
    formatDateTime(lead.lastContactedAt),
    formatDateTime(lead.createdAt),
  ])
  return '﻿' + [head, ...body].map((r) => r.map(esc).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
