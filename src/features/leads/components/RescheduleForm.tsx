import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { tomorrowAt11 } from '@/lib/dates'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useNow } from '@/store/clockStore'
import { toast } from '@/store/toastStore'
import { reschedule } from '../actions'
import { FollowUpPicker } from './FollowUpPicker'

export function RescheduleForm({ leadId, onDone }: { leadId: string; onDone: () => void }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const [at, setAt] = useState<string | null>(tomorrowAt11().toISOString())
  const [saving, setSaving] = useState(false)
  const now = useNow()
  const valid = !!at && Date.parse(at) > now - 60_000

  const save = async () => {
    if (!user || !at) return
    setSaving(true)
    try {
      await reschedule(leadId, at, user)
      toast.success(t('followUp.rescheduled'))
      onDone()
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-4">
      <FollowUpPicker value={at} onChange={setAt} />
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>{t('common.cancel')}</Button>
        <Button variant="primary" disabled={!valid} loading={saving} onClick={() => void save()}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
