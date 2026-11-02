import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, EmptyState } from '@/components/ui'

export function RouteError() {
  const { t } = useTranslation()
  const err = useRouteError()
  const msg = isRouteErrorResponse(err)
    ? `${err.status} ${err.statusText}`
    : err instanceof Error
      ? err.message
      : t('errors.generic')
  return (
    <Card className="m-6">
      <EmptyState
        icon={TriangleAlert}
        title={t('errors.title')}
        description={msg}
        action={
          <Link to="/" className="text-brand-600 underline">
            {t('errors.backHome')}
          </Link>
        }
      />
    </Card>
  )
}
