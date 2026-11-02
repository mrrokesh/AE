import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Pill toggle used for the product section and sub-filters. */
export function FilterChip({
  active,
  count,
  onClick,
  children,
  size = 'sm',
}: {
  active: boolean
  count?: number
  onClick: () => void
  children: ReactNode
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-full border font-medium whitespace-nowrap',
        size === 'md' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs',
        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-border hover:bg-surface-2',
      )}
    >
      {children}
      {count !== undefined && (
        <span className={active ? 'opacity-80' : 'text-fg-muted'}> · {count}</span>
      )}
    </button>
  )
}
