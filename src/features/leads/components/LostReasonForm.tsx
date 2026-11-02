import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Select } from '@/components/ui'
import { LOST_REASONS, type LostReasonId } from '@/constants'

/** Asks for the mandatory lost reason. */
export function LostReasonForm({
  onConfirm,
  onCancel,
}: {
  onConfirm: (r: LostReasonId) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<LostReasonId | ''>('')
  return (
    <div className="space-y-4">
      <Select
        label={t('lost.reason')}
        value={reason}
        onChange={(e) => setReason(e.target.value as LostReasonId)}
        placeholder={t('lost.choose')}
        options={LOST_REASONS.map((r) => ({ value: r.id, label: t(`lostReasons.${r.id}`) }))}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="danger" disabled={!reason} onClick={() => reason && onConfirm(reason)}>
          {t('lost.confirm')}
        </Button>
      </div>
    </div>
  )
}
