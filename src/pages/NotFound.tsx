import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, EmptyState } from '@/components/ui'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title={t('errors.notFoundTitle')}
        description={t('errors.notFoundText')}
        action={
          <Link to="/" className="text-brand-600 underline">
            {t('errors.goHome')}
          </Link>
        }
      />
    </Card>
  )
}
