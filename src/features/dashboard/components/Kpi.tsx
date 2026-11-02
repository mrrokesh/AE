import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Tone = 'danger' | 'warning' | 'success' | 'brand'
const TONE: Record<Tone, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
  brand: 'text-brand-600',
}

/** Big-number tile; links to the filtered list when `to` is given. */
export function Kpi({
  label,
  value,
  tone = 'brand',
  to,
}: {
  label: string
  value: string | number
  tone?: Tone
  to?: string
}) {
  const body = (
    <>
      <p className="text-xs font-medium text-fg-muted">{label}</p>
      <p className={cn('mt-1 text-3xl font-semibold tracking-tight', TONE[tone])}>{value}</p>
    </>
  )
  const cls = 'block rounded-lg border border-border bg-surface p-4'
  return to ? (
    <Link to={to} className={cn(cls, 'hover:bg-surface-2')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
