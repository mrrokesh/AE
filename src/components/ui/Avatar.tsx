import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-500/15 font-semibold text-brand-700 dark:text-brand-300',
        size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-xs',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
