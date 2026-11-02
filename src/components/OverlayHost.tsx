import type { ReactNode } from 'react'
import { Drawer, Modal } from '@/components/ui'
import { useOverlayStore, type OverlayConfig } from '@/store/overlayStore'

const render = (c: OverlayConfig, close: () => void): ReactNode =>
  typeof c.content === 'function' ? c.content(close) : c.content

/** Mount once in the app shell. Open overlays from anywhere via useOverlayStore. */
export function OverlayHost() {
  const { modal, drawer, closeModal, closeDrawer } = useOverlayStore()
  return (
    <>
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal?.title ?? ''}
        description={modal?.description}
        size={modal?.size}
      >
        {modal && render(modal, closeModal)}
      </Modal>
      <Drawer
        open={!!drawer}
        onClose={closeDrawer}
        title={drawer?.title ?? ''}
        description={drawer?.description}
        size={drawer?.size}
      >
        {drawer && render(drawer, closeDrawer)}
      </Drawer>
    </>
  )
}
