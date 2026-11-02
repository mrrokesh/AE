import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useUiStore, type Language } from '@/store/uiStore'

const LANGS: { id: Language; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ta', label: 'த' },
]

export function LanguageToggle() {
  const { t } = useTranslation()
  const { language, setLanguage } = useUiStore()
  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="inline-flex rounded-md bg-surface-2 p-0.5"
    >
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={language === l.id}
          title={t(`language.${l.id}`)}
          onClick={() => setLanguage(l.id)}
          className={cn(
            'h-8 min-w-8 rounded px-2 text-xs font-semibold',
            language === l.id ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
