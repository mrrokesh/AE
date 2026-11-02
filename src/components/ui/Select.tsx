import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { fieldBase } from './fieldStyles'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options?: ReadonlyArray<{ value: string; label: string }>
  placeholder?: string
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <select className={cn(fieldBase, 'h-9', error && 'border-danger', className)} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
    </Field>
  )
}
