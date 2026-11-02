import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, EmptyState } from '@/components/ui'
import { PageHeader } from './PageHeader'

/** Used by pages that are not built yet so routing works end to end. `name` is the `pages.<name>` locale key. */
export function PlaceholderPage({ name, icon }: { name: string; icon: LucideIcon }) {
  const { t } = useTranslation()
  const title = t(`pages.${name}.title`)
  return (
    <>
      <PageHeader title={title} description={t(`pages.${name}.description`)} />
      <Card>
        <EmptyState
          icon={icon}
          title={t('pages.placeholder.title', { title })}
          description={t('pages.placeholder.text')}
        />
      </Card>
    </>
  )
}
