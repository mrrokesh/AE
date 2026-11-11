import { useTranslation } from 'react-i18next'
import { Avatar, Table, TBody, Td, Th, THead, Tr } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { formatINR, formatPhone } from '@/lib/format'
import type { Customer } from '@/types'
import { lastPurchaseAt } from '../filters'

export function CustomerList({
  rows,
  onOpen,
}: {
  rows: Customer[]
  onOpen: (c: Customer) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <ul className="divide-y divide-border md:hidden">
        {rows.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onOpen(c)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2/50"
            >
              <Avatar name={c.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="block truncate text-xs text-fg-muted">
                  {formatPhone(c.phone)} · {c.city}
                </span>
              </span>
              <span className="text-right text-sm font-semibold">{formatINR(c.totalSpent)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <Th>{t('customers.col.name')}</Th>
              <Th>{t('customers.col.phone')}</Th>
              <Th>{t('customers.col.city')}</Th>
              <Th className="text-right">{t('customers.col.orders')}</Th>
              <Th className="text-right">{t('customers.col.spent')}</Th>
              <Th>{t('customers.col.last')}</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((c) => (
              <Tr key={c.id} className="cursor-pointer" onClick={() => onOpen(c)}>
                <Td>
                  <span className="flex items-center gap-2">
                    <Avatar name={c.name} size="sm" />
                    <span className="font-medium">{c.name}</span>
                  </span>
                </Td>
                <Td>{formatPhone(c.phone)}</Td>
                <Td>{c.city}</Td>
                <Td className="text-right">{c.purchases.length}</Td>
                <Td className="text-right font-semibold">{formatINR(c.totalSpent)}</Td>
                <Td>{formatDate(new Date(lastPurchaseAt(c)))}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}
