import { Link } from 'react-router-dom'
import { MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Drawer } from '@/components/ui'
import { telLink, waLink } from '@/features/leads/phone'
import { formatDate } from '@/lib/dates'
import { formatINR, formatPhone } from '@/lib/format'
import type { Customer } from '@/types'

export function CustomerDrawer({
  customer,
  onClose,
}: {
  customer: Customer | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  if (!customer) return null
  return (
    <Drawer
      open
      onClose={onClose}
      title={customer.name}
      description={[customer.businessName, customer.city].filter(Boolean).join(' · ')}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <a href={telLink(customer.phone)}>
            <Button>
              <Phone className="size-4" />
              {t('common.call')}
            </Button>
          </a>
          <a href={waLink(customer.phone)} target="_blank" rel="noreferrer">
            <Button>
              <MessageCircle className="size-4" />
              {t('common.whatsapp')}
            </Button>
          </a>
          {customer.leadId && (
            <Link to={`/leads/${customer.leadId}`}>
              <Button variant="ghost">{t('customers.viewLead')}</Button>
            </Link>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info label={t('customers.phone')} value={formatPhone(customer.phone)} />
          <Info label={t('customers.email')} value={customer.email || '—'} />
          <Info label={t('customers.totalSpent')} value={formatINR(customer.totalSpent)} />
          <Info label={t('customers.since')} value={formatDate(customer.createdAt)} />
        </dl>
        {customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {customer.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
        <section>
          <h3 className="mb-2 text-sm font-semibold">{t('customers.purchases')}</h3>
          <ul className="flex flex-col gap-2">
            {customer.purchases.map((p) => (
              <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.invoiceNo}</span>
                  <span className="font-semibold">{formatINR(p.total)}</span>
                </div>
                <p className="text-xs text-fg-muted">{formatDate(p.date)}</p>
                <ul className="mt-2 space-y-1 text-xs text-fg-muted">
                  {p.items.map((i) => (
                    <li key={i.productId} className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">
                        {i.name} × {i.qty}
                      </span>
                      <span>{formatINR(i.qty * i.unitPrice)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Drawer>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}
