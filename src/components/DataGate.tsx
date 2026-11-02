import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCrmStore } from '@/store/crmStore'
import { Button, Card, EmptyState, PageSkeleton } from '@/components/ui'

/** Shows skeleton while CRM data loads and an error state with retry if it fails. */
export function DataGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const status = useCrmStore((s) => s.status)
  const load = useCrmStore((s) => s.load)
  if (status === 'error')
    return (
      <Card className="m-6">
        <EmptyState
          icon={TriangleAlert}
          title={t('errors.title')}
          description={t('errors.generic')}
          action={<Button onClick={() => void load()}>{t('common.retry')}</Button>}
        />
      </Card>
    )
  if (status !== 'ready') return <PageSkeleton />
  return children
}
