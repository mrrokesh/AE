import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { OwnerDashboard } from '@/features/dashboard/components/OwnerDashboard'
import { StaffDashboard } from '@/features/dashboard/components/StaffDashboard'

export default function Dashboard() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const owner = isOwner(user)
  return (
    <>
      <PageHeader
        title={
          owner
            ? t('dashboard.title')
            : t('dashboard.myDay', { name: user?.name.split(' ')[0] ?? '' })
        }
        description={owner ? t('dashboard.description') : t('dashboard.myDayText')}
      />
      {owner ? <OwnerDashboard /> : <StaffDashboard />}
    </>
  )
}
