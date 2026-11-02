import { CalendarClock, ClipboardCheck, StickyNote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '@/components/ui'
import { isOpenStage } from '@/constants'
import { cn } from '@/lib/cn'
import { formatDateTime, formatRelative } from '@/lib/dates'
import { useNow } from '@/store/clockStore'
import type { Lead } from '@/types'
import { bucketOf } from '../followUps'
import { openLogActivity, openReschedule } from '../openers'

/** Shows the next action and the one-tap ways to complete or move it. */
export function LeadFollowUpPanel({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const now = useNow()
  const open = isOpenStage(lead.stage)
  const overdue = bucketOf(lead, now) === 'overdue'

  return (
    <Card className={cn('p-4', open && overdue && 'border-danger/60')}>
      <h2 className="mb-2 text-sm font-semibold">{t('leadDetail.followUp')}</h2>
      {open ? (
        <>
          <p className={cn('text-lg font-semibold', overdue && 'text-danger')}>
            {formatDateTime(lead.nextFollowUpAt)}
          </p>
          <p className={cn('mb-3 text-xs', overdue ? 'font-medium text-danger' : 'text-fg-muted')}>
            {overdue
              ? t('leadDetail.overdue', { time: formatRelative(lead.nextFollowUpAt) })
              : formatRelative(lead.nextFollowUpAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => openLogActivity(lead.id)}>
              <ClipboardCheck className="size-4" />
              {t('followUps.logOutcome')}
            </Button>
            <Button onClick={() => openReschedule(lead.id)}>
              <CalendarClock className="size-4" />
              {t('followUps.reschedule')}
            </Button>
            <Button onClick={() => openLogActivity(lead.id, 'note')}>
              <StickyNote className="size-4" />
              {t('leadDetail.addNote')}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-fg-muted">
          {t(`stages.${lead.stage}`)}
          {lead.lostReason && ` · ${t(`lostReasons.${lead.lostReason}`)}`}
        </p>
      )}
    </Card>
  )
}
