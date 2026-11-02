import type {
  ActivityType,
  CategoryId,
  LostReasonId,
  SourceId,
  StageId,
  UserRole,
} from '@/constants'

/** Every persisted entity carries these, like a typical REST resource. */
export interface Entity {
  id: string
  createdAt: string // ISO 8601 (UTC)
  updatedAt: string
}

/**
 * A timeline entry. System-generated entries carry a translation `key` (+ `params`) so they
 * render in the viewer's language; anything typed by staff goes in `text` verbatim.
 */
export interface Activity {
  id: string
  type: ActivityType
  at: string
  by: string // user id
  key?: string
  params?: Record<string, string | number>
  text?: string
}

export interface Lead extends Entity {
  name: string
  businessName: string
  phone: string // 10-digit national number, no +91
  email: string
  city: string // Salem locality or nearby town
  source: SourceId
  productInterest: string[] // product ids
  quantity: number
  budget: number | null // INR
  stage: StageId
  assignedTo: string | null // null = unassigned queue
  nextFollowUpAt: string | null
  firstContactedAt: string | null // first outbound touch (drives response-time SLA)
  lastContactedAt: string | null
  lostReason: LostReasonId | null
  activities: Activity[]
  tags: string[]
}

export type StockStatus = 'in_stock' | 'low' | 'out_of_stock'
export type Connectivity = 'USB' | 'Bluetooth' | 'LAN' | 'WiFi' | 'Serial' | 'AUX' | 'HDMI'

/** Parsed from the product page. `null` = unknown (never guessed). Fields that do not apply to a type stay null. */
export interface ProductSpecs {
  type: CategoryId
  // printers
  printWidth: string | null // '2"' | '3"' | '4"'
  speed: { value: number; unit: 'mm/s' | 'ppm' | 'ipm' | 'pages/s' } | null
  resolution: string | null // e.g. '203 x 203 dpi'
  autoCutter: boolean | null
  color: 'mono' | 'color' | null
  duty: number | null // monthly duty cycle, pages
  // speakers
  watts: number | null
  batteryHours: number | null
  waterproof: string | null // 'IPX7' or 'Waterproof'
  // both
  connectivity: Connectivity[] | null
}

export interface Product extends Entity {
  name: string
  brand: string
  category: CategoryId
  mrp: number
  sellingPrice: number
  images: string[] // original URLs on anitaenterprises.in
  url: string | null
  specs: ProductSpecs
  specsSource: 'parsed' | 'manual'
  /** Demo stock fields (editable by the owner). */
  stockQty: number
  stockStatus: StockStatus
  restockEta: string | null // YYYY-MM-DD
}

export interface PurchaseItem {
  productId: string
  name: string
  qty: number
  unitPrice: number
}

export interface Purchase {
  id: string
  invoiceNo: string
  date: string
  items: PurchaseItem[]
  total: number
}

export interface Customer extends Entity {
  leadId: string | null
  name: string
  businessName: string
  phone: string
  email: string
  city: string
  tags: string[]
  purchases: Purchase[]
  totalSpent: number
}

export interface User extends Entity {
  name: string
  role: UserRole
  email: string
  phone: string
}

/** Input for create(): server-generated fields are omitted. */
export type CreateInput<T extends Entity> = Omit<T, keyof Entity>
export type UpdateInput<T extends Entity> = Partial<CreateInput<T>>
