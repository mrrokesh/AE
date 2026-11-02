import { Clock, Siren } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import { formatMinutes, slaState } from '../sla'
import { useNow } from '@/store/clockStore'
import { useSettingsStore } from '@/store/settingsStore'
import type { Lead } from '@/types'

/** Response-time SLA for untouched leads: grey countdown, then red, then escalated. */
export function SlaBadge({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const now = useNow()
  const { slaMinutes, escalationMinutes } = useSettingsStore()
  const s = slaState(lead, now, slaMinutes, escalationMinutes)
  if (s.level === 'none') return null
  if (s.level === 'ok')
    return (
      <Badge tone="neutral">
        <Clock className="size-3" />
        {t('sla.ok', { time: formatMinutes(s.remainingMin) })}
      </Badge>
    )
  if (s.level === 'breached')
    return (
      <Badge tone="danger">
        <Clock className="size-3" />
        {t('sla.breached', { time: formatMinutes(s.ageMin) })}
      </Badge>
    )
  return (
    <Badge tone="danger" className="bg-danger text-white">
      <Siren className="size-3" />
      {t('sla.escalated', { time: formatMinutes(s.ageMin) })}
    </Badge>
  )
}
