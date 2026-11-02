import { useOverlayStore } from '@/store/overlayStore'
import i18n from '@/i18n'
import { type LogActivityInput } from './actions'
import { LogActivityForm } from './components/LogActivityForm'
import { QuickAddForm } from './components/QuickAddForm'
import { RescheduleForm } from './components/RescheduleForm'
import { LostReasonForm } from './components/LostReasonForm'
import type { LostReasonId } from '@/constants'

/** Imperative entry points so any page, hotkey or button can open the same overlays. */
const open = () => useOverlayStore.getState()

export function openQuickAdd() {
  if (open().modal) return
  open().openModal({
    title: i18n.t('quickAdd.title'),
    description: i18n.t('quickAdd.description'),
    content: (close) => <QuickAddForm onDone={close} />,
  })
}

export function openLogActivity(leadId: string, defaultType: LogActivityInput['type'] = 'call') {
  open().closeModal()
  open().openModal({
    title: i18n.t('logActivity.title'),
    content: (close) => (
      <LogActivityForm leadId={leadId} defaultType={defaultType} onDone={close} />
    ),
  })
}

export function openReschedule(leadId: string) {
  open().openModal({
    title: i18n.t('followUp.rescheduleTitle'),
    size: 'sm',
    content: (close) => <RescheduleForm leadId={leadId} onDone={close} />,
  })
}

export function openLostReason(onConfirm: (r: LostReasonId) => void) {
  open().openModal({
    title: i18n.t('lost.title'),
    description: i18n.t('lost.description'),
    size: 'sm',
    content: (close) => (
      <LostReasonForm
        onCancel={close}
        onConfirm={(r) => {
          close()
          onConfirm(r)
        }}
      />
    ),
  })
}
