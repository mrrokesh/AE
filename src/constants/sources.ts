/** Labels: `sources.<id>` */
export const LEAD_SOURCES = [
  { id: 'phone' },
  { id: 'whatsapp' },
  { id: 'walk_in' },
  { id: 'website' },
] as const
export type SourceId = (typeof LEAD_SOURCES)[number]['id']
