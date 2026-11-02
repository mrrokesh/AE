import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { fieldBase } from './fieldStyles'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, rows = 3, ...rest }: TextareaProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <textarea
        rows={rows}
        className={cn(fieldBase, 'py-2', error && 'border-danger', className)}
        {...rest}
      />
    </Field>
  )
}
