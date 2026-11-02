import { Download, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Select } from '@/components/ui'
import { LEAD_STAGES, type LostReasonId, type StageId } from '@/constants'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useCrmStore } from '@/store/crmStore'
import { toast } from '@/store/toastStore'
import { bulkAssign, bulkStage } from '../actions'
import { openLostReason } from '../openers'

export function BulkBar({
  ids,
  onClear,
  onExport,
}: {
  ids: string[]
  onClear: () => void
  onExport: () => void
}) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const users = useCrmStore((s) => s.users)
  if (!user || ids.length === 0) return null

  const assign = async (userId: string) => {
    const target = users.find((u) => u.id === userId)
    if (!target) return
    await bulkAssign(ids, target, user)
    toast.success(t('leads.bulk.assigned', { count: ids.length, name: target.name }))
    onClear()
  }
  const stage = async (s: StageId, reason?: LostReasonId) => {
    await bulkStage(ids, s, user, reason)
    toast.success(t('leads.bulk.staged', { count: ids.length }))
    onClear()
  }

  return (
    <div className="sticky top-0 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-500/40 bg-surface p-2.5 shadow-md">
      <span className="px-1 text-sm font-medium">
        {t('leads.bulk.selected', { count: ids.length })}
      </span>
      {isOwner(user) && (
        <Select
          aria-label={t('leads.bulk.assign')}
          className="w-44"
          value=""
          onChange={(e) => void assign(e.target.value)}
          placeholder={t('leads.bulk.assign')}
          options={users
            .filter((u) => u.role === 'staff')
            .map((u) => ({ value: u.id, label: u.name }))}
        />
      )}
      <Select
        aria-label={t('leads.bulk.stage')}
        className="w-44"
        value=""
        onChange={(e) => {
          const s = e.target.value as StageId
          if (s === 'lost') openLostReason((r) => void stage(s, r))
          else if (s) void stage(s)
        }}
        placeholder={t('leads.bulk.stage')}
        options={LEAD_STAGES.map((s) => ({ value: s.id, label: t(`stages.${s.id}`) }))}
      />
      <Button onClick={onExport}>
        <Download className="size-4" />
        {t('leads.export')}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('common.clear')}
        onClick={onClear}
        className="ml-auto"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
