import { RefreshCw, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AiThinking } from '@/features/ai/components/AiThinking'
import { Typewriter } from '@/features/ai/components/Typewriter'
import { useAiTask } from '@/features/ai/useAiTask'
import { useLang } from '@/features/ai/useLeadCtx'
import { useScopedLeads } from '@/features/auth/useCurrentUser'
import { Button, Card } from '@/components/ui'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import { useSettingsStore } from '@/store/settingsStore'

/** AI morning briefing for the owner. */
export function BriefingCard() {
  const { t } = useTranslation()
  const leads = useScopedLeads()
  const { users, products } = useCrmStore()
  const slaMinutes = useSettingsStore((s) => s.slaMinutes)
  const now = useNow()
  const lang = useLang()
  const key = `${lang}|${leads.length}|${Math.floor(now / 3_600_000)}`
  const { data, loading, rerun } = useAiTask(
    'dailyBriefing',
    { leads, users, products, now, lang, slaMinutes },
    key,
  )
  return (
    <Card className="border-brand-500/40 bg-brand-50/50 p-4 dark:bg-surface">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-brand-600" />
          {t('dashboard.briefing')}
        </h2>
        <Button variant="ghost" size="icon" aria-label={t('aiPanel.regenerate')} onClick={rerun}>
          <RefreshCw className="size-4" />
        </Button>
      </div>
      {loading || !data ? (
        <AiThinking />
      ) : (
        <p className="text-sm leading-relaxed">
          <Typewriter key={data.text} text={data.text} />
        </p>
      )}
    </Card>
  )
}
