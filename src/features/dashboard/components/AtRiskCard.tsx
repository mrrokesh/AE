import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AiThinking } from '@/features/ai/components/AiThinking'
import { useAiTask } from '@/features/ai/useAiTask'
import { useLang } from '@/features/ai/useLeadCtx'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { Card } from '@/components/ui'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import { useSettingsStore } from '@/store/settingsStore'

/** Warm/hot leads nobody has talked to for a while. */
export function AtRiskCard() {
  const { t } = useTranslation()
  const leads = useScopedLeads()
  const { users, products } = useCrmStore()
  const slaMinutes = useSettingsStore((s) => s.slaMinutes)
  const now = useNow()
  const lang = useLang()
  const { data, loading } = useAiTask(
    'atRiskLeads',
    { leads, users, products, now, lang, slaMinutes, days: 3 },
    `${lang}|${leads.length}|${Math.floor(now / 3_600_000)}`,
  )
  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <AlertTriangle className="size-4 text-warning" />
        {t('dashboard.atRisk')}
      </h2>
      {loading || !data ? (
        <AiThinking />
      ) : data.items.length === 0 ? (
        <p className="py-4 text-center text-sm text-fg-muted">{t('dashboard.atRiskNone')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.items.map((i) => (
            <li key={i.leadId} className="py-2 first:pt-0">
              <Link to={`/leads/${i.leadId}`} className="text-sm font-medium hover:underline">
                {i.name}
              </Link>
              <p className="text-xs text-fg-muted">{i.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
