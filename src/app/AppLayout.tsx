import { Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { DataGate } from '@/components/DataGate'
import { OverlayHost } from '@/components/OverlayHost'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { PageSkeleton, ToastViewport } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useEnquirySimulator } from '@/features/enquiries/useEnquirySimulator'
import { useDueAlerts } from '@/features/notifications/useDueAlerts'
import { useHotkeys } from '@/features/leads/useHotkeys'
import { useCrmStore } from '@/store/crmStore'
import { useSessionStore } from '@/store/sessionStore'

export function AppLayout() {
  const status = useCrmStore((s) => s.status)
  const userId = useSessionStore((s) => s.currentUserId)
  const user = useCurrentUser()

  useHotkeys()
  useEnquirySimulator(status === 'ready' && !!user)
  useDueAlerts(status === 'ready' && !!user)

  if (!userId || (status === 'ready' && !user)) return <Navigate to="/login" replace />

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <DataGate>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </DataGate>
        </main>
      </div>
      <OverlayHost />
      <ToastViewport />
    </div>
  )
}
