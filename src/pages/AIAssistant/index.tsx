import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { AssistantChat } from '@/features/ai/components/AssistantChat'

export default function AIAssistant() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('assistant.title')} description={t('assistant.description')} />
      <AssistantChat />
    </>
  )
}
