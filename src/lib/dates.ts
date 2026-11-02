import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { ta } from 'date-fns/locale/ta'
import i18n from '@/i18n'

const TZ = 'Asia/Kolkata'

function parts(date: Date, opts: Intl.DateTimeFormatOptions) {
  const out: Record<string, string> = {}
  for (const p of new Intl.DateTimeFormat(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', {
    timeZone: TZ,
    ...opts,
  }).formatToParts(date)) {
    out[p.type] = p.value
  }
  return out
}

const toDate = (v: string | Date) => (typeof v === 'string' ? parseISO(v) : v)

/** "01 Nov 2026" in IST. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const p = parts(toDate(value), { day: '2-digit', month: 'short', year: 'numeric' })
  return `${p.day} ${p.month} ${p.year}`
}

/** "01 Nov 2026, 04:30 PM" in IST. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = toDate(value)
  const t = parts(d, { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${formatDate(d)}, ${t.hour}:${t.minute} ${t.dayPeriod?.toUpperCase()}`
}

/** "3 days ago" / "in 2 hours", localised. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return formatDistanceToNowStrict(toDate(value), {
    addSuffix: true,
    locale: i18n.language === 'ta' ? ta : undefined,
  })
}

const IST_OFFSET = 5.5 * 3_600_000
const DAY_MS = 86_400_000
/** Epoch ms of 00:00 IST for the day containing `t`. */
export const startOfDayIST = (t: number) =>
  Math.floor((t + IST_OFFSET) / DAY_MS) * DAY_MS - IST_OFFSET
export const endOfDayIST = (t: number) => startOfDayIST(t) + DAY_MS
/** Tomorrow at 11:00 IST (default follow-up). */
export const tomorrowAt11 = (now = Date.now()) =>
  new Date(startOfDayIST(now) + DAY_MS + 11 * 3_600_000)

/** "11:30 AM" in IST. */
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const t = parts(toDate(value), { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${t.hour}:${t.minute} ${t.dayPeriod?.toUpperCase()}`
}

/** ISO <-> value for <input type="datetime-local"> in IST. */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(new Date(iso).getTime() + IST_OFFSET)
  return d.toISOString().slice(0, 16)
}
export function fromDateTimeLocal(v: string): string | null {
  return v ? new Date(`${v}:00+05:30`).toISOString() : null
}

/** ISO -> "yyyy-MM-dd" in IST, for <input type="date">. */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const p = parts(parseISO(iso), { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${p.year}-${p.month}-${p.day}`
}

/** "yyyy-MM-dd" (an IST calendar day) -> ISO at 10:00 IST. */
export function fromDateInputValue(value: string): string | null {
  return value ? new Date(`${value}T10:00:00+05:30`).toISOString() : null
}
