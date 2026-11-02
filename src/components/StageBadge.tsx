import { useTranslation } from 'react-i18next'
import { STAGE_BY_ID, type StageId } from '@/constants'
import { Badge } from '@/components/ui'

export function StageBadge({ stage }: { stage: StageId }) {
  const { t } = useTranslation()
  return <Badge tone={STAGE_BY_ID[stage].tone}>{t(`stages.${stage}`)}</Badge>
}
