import { useCallback, useEffect, useState } from 'react'
import i18n from '@/i18n'
import { adminApi, customersApi, leadsApi, productsApi, usersApi } from '@/services/api'
import { useCrmStore } from '@/store/crmStore'
import { toast } from '@/store/toastStore'

export interface DemoCounts {
  leads: number
  products: number
  customers: number
  users: number
}

async function fetchCounts(): Promise<DemoCounts> {
  const [l, p, c, u] = await Promise.all(
    [leadsApi, productsApi, customersApi, usersApi].map((a) => a.list({ pageSize: 1 })),
  )
  return { leads: l.total, products: p.total, customers: c.total, users: u.total }
}

export function useDemoData() {
  const [counts, setCounts] = useState<DemoCounts | null>(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    void fetchCounts().then(setCounts)
  }, [])

  const reset = useCallback(async () => {
    setResetting(true)
    try {
      await adminApi.resetDemoData()
      useCrmStore.setState({ status: 'idle' })
      await useCrmStore.getState().load()
      setCounts(await fetchCounts())
      toast.success(i18n.t('settings.resetDone'), i18n.t('settings.resetDoneText'))
    } catch {
      toast.error(i18n.t('settings.resetFailed'))
    } finally {
      setResetting(false)
    }
  }, [])

  return { counts, resetting, reset }
}
