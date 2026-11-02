import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { PipelineBoard } from '@/features/leads/components/PipelineBoard'
import { useScoredLeads } from '@/features/leads/useLeadRows'

export default function Pipeline() {
  const { t } = useTranslation()
  const rows = useScoredLeads()
  return (
    <>
      <PageHeader title={t('pipeline.title')} description={t('pipeline.description')} />
      <PipelineBoard rows={rows} />
    </>
  )
}
