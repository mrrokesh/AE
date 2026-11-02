import type { Lead } from '@/types'

/** "+91 98420 12345" | "098420-12345" -> "9842012345", or null if not a valid Indian mobile. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const national = digits.length > 10 ? digits.slice(-10) : digits
  return /^[6-9]\d{9}$/.test(national) ? national : null
}

export function findDuplicate(rawPhone: string, leads: Lead[]): Lead | null {
  const phone = normalizePhone(rawPhone)
  return phone ? (leads.find((l) => l.phone === phone) ?? null) : null
}

export const telLink = (phone: string) => `tel:+91${phone}`

/** wa.me link with a prefilled message. */
export const waLink = (phone: string, text = '') =>
  `https://wa.me/91${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`
