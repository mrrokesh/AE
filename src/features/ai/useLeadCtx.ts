import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useNow } from '@/store/clockStore'
import { useCrmStore } from '@/store/crmStore'
import type { LeadCtx, Lang } from '@/services/ai'
import type { Lead } from '@/types'

export function useLang(): Lang {
  return useTranslation().i18n.language === 'ta' ? 'ta' : 'en'
}

export function useLeadCtx(lead: Lead): LeadCtx {
  const { products, users } = useCrmStore()
  const user = useCurrentUser()
  const now = useNow()
  const lang = useLang()
  return { lead, products, users, staffName: user?.name ?? '', now, lang }
}
