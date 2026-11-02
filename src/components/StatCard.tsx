import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-fg-muted">
        <span className="text-xs font-medium">{label}</span>
        {Icon && <Icon className="size-4" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </Card>
  )
}
