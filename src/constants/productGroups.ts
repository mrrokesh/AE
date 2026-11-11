import type { CategoryId } from './categories'

/** Top-level catalogue sections; each owns some categories (printer types are the printers' sub-filter). */
export const PRODUCT_GROUPS = [
  {
    id: 'printers',
    categories: ['thermal', 'label', 'dot_matrix', 'laser', 'ink_tank', 'photo', 'cartridge'],
  },
  { id: 'speakers', categories: ['speaker'] },
  { id: 'computers', categories: ['laptop', 'desktop'] },
  { id: 'accessories', categories: ['charger', 'ram', 'storage', 'peripheral', 'accessory'] },
] as const satisfies readonly { id: string; categories: readonly CategoryId[] }[]
export type ProductGroupId = (typeof PRODUCT_GROUPS)[number]['id']
export const groupOfCategory = (c: CategoryId): ProductGroupId | undefined =>
  PRODUCT_GROUPS.find((g) => (g.categories as readonly string[]).includes(c))?.id
