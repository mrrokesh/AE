const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** 1234567 -> "₹12,34,567" (en-IN lakh/crore grouping). */
export function formatINR(value: number): string {
  return inr.format(value)
}

/** Compact form for dashboards: 1250000 -> "₹12.5 L", 25000000 -> "₹2.5 Cr". */
export function formatINRCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e7) return `₹${trim(value / 1e7)} Cr`
  if (abs >= 1e5) return `₹${trim(value / 1e5)} L`
  return formatINR(value)
}
const trim = (n: number) => n.toFixed(2).replace(/\.?0+$/, '')

/** "9842012345" | "+919842012345" | "09842012345" -> "+91 98420 12345". Falls back to input. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const national = digits.length > 10 ? digits.slice(-10) : digits
  if (national.length !== 10) return raw
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`
}

/** Digits-only international number for wa.me / tel: links. */
export function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return `91${digits.slice(-10)}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}
