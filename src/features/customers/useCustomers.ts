import { useMemo } from 'react'
import { canSeeLead } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useCrmStore } from '@/store/crmStore'

/** Owner sees all customers; staff see customers that came from a lead they can see. */
export function useScopedCustomers() {
  const user = useCurrentUser()
  const customers = useCrmStore((s) => s.customers)
  const leads = useCrmStore((s) => s.leads)
  return useMemo(() => {
    if (!user) return []
    if (user.role === 'owner') return customers
    const byId = new Map(leads.map((l) => [l.id, l]))
    return customers.filter((c) => {
      const lead = c.leadId ? byId.get(c.leadId) : undefined
      return lead ? canSeeLead(user, lead) : false
    })
  }, [user, customers, leads])
}
