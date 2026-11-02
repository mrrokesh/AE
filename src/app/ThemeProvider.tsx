import { useEffect, type ReactNode } from 'react'
import i18n from '@/i18n'
import { useUiStore } from '@/store/uiStore'

/** Syncs <html class="dark"> with the theme and <html lang> + i18next with the chosen language. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme)
  const language = useUiStore((s) => s.language)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        theme === 'dark' || (theme === 'system' && mq.matches),
      )
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    void i18n.changeLanguage(language)
    document.documentElement.lang = language
  }, [language])

  return children
}
