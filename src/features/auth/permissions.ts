import type { Lead, User } from '@/types'

export const isOwner = (user: User | null | undefined) => user?.role === 'owner'

/** Owner sees everything. Staff see only leads assigned to them plus the unassigned queue. */
export function canSeeLead(user: User | null | undefined, lead: Lead): boolean {
  if (!user) return false
  return user.role === 'owner' || lead.assignedTo === user.id || lead.assignedTo === null
}

export const scopeLeads = (user: User | null | undefined, leads: Lead[]) =>
  leads.filter((l) => canSeeLead(user, l))
