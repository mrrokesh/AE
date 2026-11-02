import { useNavigate } from 'react-router-dom'
import { Check, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, Badge, Popover } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useCrmStore } from '@/store/crmStore'
import { useSessionStore } from '@/store/sessionStore'

/** Avatar menu with one-tap "Switch user" for fast demo switching. */
export function UserMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useCurrentUser()
  const users = useCrmStore((s) => s.users)
  const { signIn, signOut } = useSessionStore()
  if (!user) return null

  return (
    <Popover
      panelClassName="w-64"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={t('auth.switchUser')}
          className="flex items-center gap-2 rounded-md p-1 hover:bg-surface-2"
        >
          <Avatar name={user.name} />
          <span className="hidden max-w-28 truncate text-left text-xs leading-tight lg:block">
            <span className="block truncate font-medium">{user.name}</span>
            <span className="block text-fg-muted">{t(`roles.${user.role}`)}</span>
          </span>
        </button>
      )}
    >
      {(close) => (
        <div className="p-1.5">
          <p className="px-2 py-1.5 text-xs font-medium text-fg-muted">{t('auth.switchUser')}</p>
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                signIn(u.id)
                close()
                navigate('/')
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-surface-2"
            >
              <Avatar name={u.name} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm">{u.name}</span>
              <Badge tone={u.role === 'owner' ? 'brand' : 'neutral'}>{t(`roles.${u.role}`)}</Badge>
              {u.id === user.id && <Check className="size-4 text-brand-600" />}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              signOut()
              navigate('/login')
            }}
            className="mt-1 flex w-full items-center gap-2 border-t border-border px-2 py-2 text-sm text-fg-muted hover:text-fg"
          >
            <LogOut className="size-4" /> {t('auth.signOut')}
          </button>
        </div>
      )}
    </Popover>
  )
}
