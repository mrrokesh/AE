import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui'
import { fromDateTimeLocal, startOfDayIST, toDateTimeLocal } from '@/lib/dates'
import { cn } from '@/lib/cn'
import { useNow } from '@/store/clockStore'

const H = 3_600_000
const D = 24 * H

/** Quick chips + exact date/time. `value` is an ISO string. */
export function FollowUpPicker({
  value,
  onChange,
  label,
}: {
  value: string | null
  onChange: (iso: string | null) => void
  label?: string
}) {
  const { t } = useTranslation()
  const now = useNow()
  const day0 = startOfDayIST(now)
  const at11 = (days: number) => new Date(day0 + days * D + 11 * H).toISOString()
  const chips = [
    { id: 'in2h', iso: new Date(now + 2 * H).toISOString() },
    { id: 'tomorrow11', iso: at11(1) },
    { id: 'in3days', iso: at11(3) },
    { id: 'nextWeek', iso: at11(7) },
  ]
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.iso)}
            className={cn(
              'h-8 rounded-full border px-3 text-xs font-medium',
              value && Math.abs(Date.parse(value) - Date.parse(c.iso)) < 60_000
                ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                : 'border-border text-fg-muted hover:bg-surface-2',
            )}
          >
            {t(`followUp.${c.id}`)}
          </button>
        ))}
      </div>
      <Input
        label={label ?? t('followUp.label')}
        type="datetime-local"
        value={toDateTimeLocal(value)}
        onChange={(e) => onChange(fromDateTimeLocal(e.target.value))}
      />
    </div>
  )
}
