import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Avatar, Card, Skeleton } from '@/components/ui'
import { useCrmStore } from '@/store/crmStore'
import { useSessionStore } from '@/store/sessionStore'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const users = useCrmStore((s) => s.users)
  const status = useCrmStore((s) => s.status)
  const signIn = useSessionStore((s) => s.signIn)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            AE
          </span>
          <h1 className="text-xl font-semibold tracking-tight">{t('app.name')}</h1>
          <p className="text-sm text-fg-muted">{t('auth.subtitle')}</p>
        </div>
        <Card className="divide-y divide-border">
          {status !== 'ready'
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="m-3 h-12" />)
            : [...users]
                .sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0))
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      signIn(u.id)
                      navigate('/')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left first:rounded-t-lg last:rounded-b-lg hover:bg-surface-2"
                  >
                    {u.role === 'owner' ? (
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-600 text-white">
                        <Building2 className="size-4" />
                      </span>
                    ) : (
                      <Avatar name={u.name} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {u.role === 'owner' ? t('auth.ownerLabel') : u.name}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {t(u.role === 'owner' ? 'auth.ownerDesc' : 'auth.staffDesc')}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-fg-subtle" />
                  </button>
                ))}
        </Card>
        <p className="mt-4 text-center text-xs text-fg-subtle">{t('auth.demoNote')}</p>
        <p className="mt-8 text-center text-xs text-fg-subtle">{t('app.poweredBy')}</p>
      </div>
    </div>
  )
}
