import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function AiThinking() {
  const { t } = useTranslation()
  return (
    <p className="flex animate-pulse items-center gap-1.5 text-sm text-fg-muted">
      <Sparkles className="size-4" />
      {t('aiPanel.thinking')}
    </p>
  )
}
