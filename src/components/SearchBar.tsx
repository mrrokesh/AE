import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'

/** Press "/" anywhere to focus. */
export function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(el.tagName)) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(q.trim())
  }

  return (
    <form onSubmit={submit} role="search" className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtle" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('topbar.search')}
        aria-label={t('topbar.searchLabel')}
        className="h-9 w-full rounded-md border border-border bg-surface-2 pr-3 pl-8 text-sm placeholder:text-fg-subtle focus:border-brand-500 focus:bg-surface focus:outline-2 focus:outline-brand-500/30"
      />
    </form>
  )
}
