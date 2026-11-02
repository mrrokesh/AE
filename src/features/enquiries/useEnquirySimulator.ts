import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { receiveWebsiteEnquiry } from './actions'

/** Demo mode: a website enquiry arrives roughly every 90 seconds while the app is open. */
export function useEnquirySimulator(active: boolean) {
  const enabled = useSettingsStore((s) => s.simulateEnquiries)
  useEffect(() => {
    if (!active || !enabled) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(
        () => {
          void receiveWebsiteEnquiry().finally(schedule)
        },
        80_000 + Math.random() * 20_000,
      )
    }
    schedule()
    return () => clearTimeout(timer)
  }, [active, enabled])
}
