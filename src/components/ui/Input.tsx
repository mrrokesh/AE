import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { fieldBase } from './fieldStyles'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...rest }: InputProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input className={cn(fieldBase, 'h-9', error && 'border-danger', className)} {...rest} />
    </Field>
  )
}
