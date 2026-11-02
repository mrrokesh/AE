import { useMemo } from 'react'
import { useCrmStore } from '@/store/crmStore'
import { useSessionStore } from '@/store/sessionStore'
import { scopeLeads } from './permissions'

export function useCurrentUser() {
  const id = useSessionStore((s) => s.currentUserId)
  const users = useCrmStore((s) => s.users)
  return useMemo(() => users.find((u) => u.id === id) ?? null, [users, id])
}

/** Leads the signed-in user is allowed to see (role-scoped). */
export function useScopedLeads() {
  const user = useCurrentUser()
  const leads = useCrmStore((s) => s.leads)
  return useMemo(() => scopeLeads(user, leads), [user, leads])
}
