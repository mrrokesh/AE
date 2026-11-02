import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { NAV_ITEMS } from '@/app/navigation'
import { cn } from '@/lib/cn'
import { useUiStore } from '@/store/uiStore'
import { isOwner } from '@/features/auth/permissions'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useUnassigned } from '@/features/enquiries/useUnassigned'

export function Sidebar() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const inboxCount = useUnassigned().length
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNav } = useUiStore()

  const content = (collapsed: boolean, mobile: boolean) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-14 items-center border-b border-border px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
            AE
          </span>
          {!collapsed && <span className="truncate text-sm font-semibold">{t('app.name')}</span>}
        </div>
        {mobile && (
          <button
            type="button"
            onClick={() => setMobileNav(false)}
            aria-label={t('nav.closeMenu')}
            className="text-fg-muted"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label={t('nav.main')}>
        {NAV_ITEMS.filter((n) => !n.ownerOnly || isOwner(user)).map(
          ({ to, labelKey, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? t(labelKey) : undefined}
              onClick={() => setMobileNav(false)}
              className={({ isActive }) =>
                cn(
                  'relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-brand-500/12 text-brand-700 dark:text-brand-300'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{t(labelKey)}</span>}
              {badge === 'inbox' && inboxCount > 0 && (
                <span
                  aria-label={t('inbox.badge', { count: inboxCount })}
                  className={cn(
                    'inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white',
                    collapsed && 'absolute top-0.5 right-1 min-w-4 px-1 text-[10px]',
                  )}
                >
                  {inboxCount}
                </span>
              )}
            </NavLink>
          ),
        )}
      </nav>
      {!collapsed && <p className="px-4 pb-2 text-[11px] text-fg-subtle">{t('app.poweredBy')}</p>}
      {!mobile && (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? t('nav.expand') : t('nav.collapseSidebar')}
            className={cn(
              'flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-sm text-fg-muted hover:bg-surface-2',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
            {!collapsed && <span>{t('nav.collapse')}</span>}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-border bg-surface transition-[width] md:block',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
      >
        {content(sidebarCollapsed, false)}
      </aside>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNav(false)} />
          <aside className="relative h-full w-64 border-r border-border bg-surface">
            {content(false, true)}
          </aside>
        </div>
      )}
    </>
  )
}
