/** Labels: `categories.<id>` */
export const PRODUCT_CATEGORIES = [
  { id: 'thermal' },
  { id: 'label' },
  { id: 'dot_matrix' },
  { id: 'laser' },
  { id: 'ink_tank' },
  { id: 'photo' },
  { id: 'cartridge' },
  { id: 'speaker' },
  { id: 'accessory' },
  { id: 'charger' },
  { id: 'ram' },
  { id: 'storage' },
  { id: 'peripheral' },
  { id: 'laptop' },
  { id: 'desktop' },
] as const
export type CategoryId = (typeof PRODUCT_CATEGORIES)[number]['id']

export const ACTIVITY_TYPES = [
  'call',
  'whatsapp',
  'visit',
  'note',
  'stage_change',
  'system',
] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const USER_ROLES = ['owner', 'staff'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const TEMPERATURES = ['hot', 'warm', 'cold'] as const
export type Temperature = (typeof TEMPERATURES)[number]
