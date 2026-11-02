import { fromDateInputValue, toDateInputValue } from '@/lib/dates'
import { Input, type InputProps } from './Input'

interface DatePickerProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /** ISO string (UTC) or null. */
  value: string | null
  onChange: (iso: string | null) => void
}

/** Thin wrapper over the native date input that speaks ISO + IST. Swap the internals later if needed. */
export function DatePicker({ value, onChange, ...rest }: DatePickerProps) {
  return (
    <Input
      type="date"
      value={toDateInputValue(value)}
      onChange={(e) => onChange(fromDateInputValue(e.target.value))}
      {...rest}
    />
  )
}
