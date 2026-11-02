import { useOverlayStore } from '@/store/overlayStore'
import i18n from '@/i18n'
import { type LogActivityInput } from './actions'
import { LogActivityForm } from './components/LogActivityForm'
import { QuickAddForm } from './components/QuickAddForm'
import { RescheduleForm } from './components/RescheduleForm'
import { LostReasonForm } from './components/LostReasonForm'
import type { LostReasonId } from '@/constants'
import { oosInterest } from '@/features/products/alternatives'
import { AlternativeMessageForm } from '@/features/products/components/AlternativeMessageForm'
import { OutOfStockLostPrompt } from '@/features/products/components/OutOfStockLostPrompt'
import type { Alternative } from '@/features/products/similarity'
import { useCrmStore } from '@/store/crmStore'
import type { Product } from '@/types'

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

/**
 * Asks for the lost reason. When `leadId` is given and the reason is "out of stock" while the lead wants
 * an out-of-stock product, first offers an alternative or the waitlist so the sale is not lost.
 */
export function openLostReason(onConfirm: (r: LostReasonId) => void, leadId?: string) {
  open().openModal({
    title: i18n.t('lost.title'),
    description: i18n.t('lost.description'),
    size: 'sm',
    content: (close) => (
      <LostReasonForm
        onCancel={close}
        onConfirm={(r) => {
          const { leads, products } = useCrmStore.getState()
          const lead = leadId ? leads.find((l) => l.id === leadId) : undefined
          close()
          if (r === 'out_of_stock' && lead && oosInterest(lead, products).length > 0) {
            // Let the first modal unmount before opening the next one.
            queueMicrotask(() =>
              open().openModal({
                title: i18n.t('catalog.lostPrompt.title'),
                size: 'sm',
                content: (closePrompt) => (
                  <OutOfStockLostPrompt
                    lead={lead}
                    onClose={closePrompt}
                    onLostAnyway={() => {
                      closePrompt()
                      onConfirm(r)
                    }}
                  />
                ),
              }),
            )
          } else onConfirm(r)
        }}
      />
    ),
  })
}

export function openAlternativeMessage(leadId: string, original: Product, alt: Alternative) {
  open().openModal({
    title: i18n.t('catalog.alt.draftTitle'),
    description: alt.product.name,
    content: (close) => (
      <AlternativeMessageForm leadId={leadId} original={original} alt={alt} onDone={close} />
    ),
  })
}
