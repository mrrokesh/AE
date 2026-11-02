import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** Presentational table primitives. Pair with @tanstack/react-table for logic. */
export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...rest} />
    </div>
  )
}
export const THead = (p: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="border-b border-border bg-surface-2/60" {...p} />
)
export const TBody = (p: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="divide-y divide-border" {...p} />
)
export const Tr = ({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('hover:bg-surface-2/50', className)} {...rest} />
)
export const Th = ({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn('px-3 py-2 text-xs font-medium whitespace-nowrap text-fg-muted', className)}
    {...rest}
  />
)
export const Td = ({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-3 py-2.5 align-middle', className)} {...rest} />
)
