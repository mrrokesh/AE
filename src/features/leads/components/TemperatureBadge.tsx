import { Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { Temperature, Tone } from '@/constants'

const TONE: Record<Temperature, Tone> = { hot: 'danger', warm: 'warning', cold: 'info' }

export function TemperatureBadge({ temperature }: { temperature: Temperature }) {
  const { t } = useTranslation()
  return (
    <Badge tone={TONE[temperature]}>
      {temperature === 'hot' && <Flame className="size-3" />}
      {t(`temperature.${temperature}`)}
    </Badge>
  )
}
