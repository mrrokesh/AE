import type { ReactNode } from 'react'

/** Label + hint/error wrapper shared by Input, Select, Textarea, DatePicker. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-fg-muted">{label}</span>}
      {children}
      {error ? (
        <span className="block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-fg-subtle">{hint}</span>
      ) : null}
    </label>
  )
}
