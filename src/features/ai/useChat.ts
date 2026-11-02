import { useState } from 'react'
import { useCurrentUser, useScopedLeads } from '@/features/auth/useCurrentUser'
import { ask } from '@/services/ai'
import { useClockStore } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useLang } from './useLeadCtx'

export interface ChatMsg {
  id: number
  role: 'user' | 'assistant'
  text: string
}

export function useChat() {
  const leads = useScopedLeads()
  const user = useCurrentUser()
  const { users, products } = useCrmStore()
  const slaMinutes = useSettingsStore((s) => s.slaMinutes)
  const lang = useLang()
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [busy, setBusy] = useState(false)

  const send = async (question: string) => {
    const q = question.trim()
    if (!q || busy || !user) return
    setMsgs((m) => [...m, { id: m.length, role: 'user', text: q }])
    setBusy(true)
    try {
      const { output } = await ask({
        task: 'chatWithCRM',
        input: {
          question: q,
          leads,
          users,
          products,
          now: useClockStore.getState().now,
          lang,
          slaMinutes,
        },
      })
      setMsgs((m) => [...m, { id: m.length, role: 'assistant', text: output.reply }])
    } finally {
      setBusy(false)
    }
  }
  return { msgs, busy, send }
}
