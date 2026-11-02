import { useNavigate } from 'react-router-dom'
import { Menu, Monitor, Moon, Plus, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { LanguageToggle } from './LanguageToggle'
import { SearchBar } from './SearchBar'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { openQuickAdd } from '@/features/leads/openers'
import { useUiStore, type Theme } from '@/store/uiStore'

const NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
const ICON = { light: Sun, dark: Moon, system: Monitor }

export function Topbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { theme, setTheme, setMobileNav } = useUiStore()
  const ThemeIcon = ICON[theme]

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 md:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t('nav.openMenu')}
        onClick={() => setMobileNav(true)}
      >
        <Menu className="size-5" />
      </Button>
      <SearchBar onSearch={(q) => navigate(q ? `/leads?q=${encodeURIComponent(q)}` : '/leads')} />
      <div className="ml-auto flex items-center gap-1.5">
        <LanguageToggle />
        <NotificationBell />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${t('theme.label')}: ${t(`theme.${theme}`)}`}
          title={t(`theme.${theme}`)}
          onClick={() => setTheme(NEXT[theme])}
        >
          <ThemeIcon className="size-4" />
        </Button>
        <Button variant="primary" onClick={openQuickAdd} title={t('quickAdd.shortcutHint')}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t('topbar.newLead')}</span>
        </Button>
        <UserMenu />
      </div>
    </header>
  )
}
