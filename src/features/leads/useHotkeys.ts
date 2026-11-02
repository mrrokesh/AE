import { useEffect } from 'react'
import { openQuickAdd } from './openers'

/** Global shortcuts: N = Quick Add (ignored while typing). */
export function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement
      if (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable) return
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openQuickAdd()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
}
