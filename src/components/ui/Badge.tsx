import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import type { Tone } from '@/constants'

const tones: Record<Tone, string> = {
  neutral: 'bg-fg/8 text-fg-muted',
  brand: 'bg-brand-500/15 text-brand-700 dark:text-brand-300',
  info: 'bg-info/15 text-info',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  violet: 'bg-violet/15 text-violet',
}

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...rest}
    />
  )
}
