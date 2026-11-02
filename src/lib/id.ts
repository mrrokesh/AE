/** Short unique id with a readable prefix, e.g. `l_k3j2h1ab`. */
export function generateId(prefix: string): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  return `${prefix}_${rand}`
}
