import {
  Building2,
  CalendarClock,
  ChartColumn,
  Columns3,
  Inbox,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
  badge?: 'inbox'
  ownerOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/inbox', labelKey: 'nav.inbox', icon: Inbox, badge: 'inbox' },
  { to: '/leads', labelKey: 'nav.leads', icon: Users },
  { to: '/pipeline', labelKey: 'nav.pipeline', icon: Columns3 },
  { to: '/follow-ups', labelKey: 'nav.followUps', icon: CalendarClock },
  { to: '/team-day', labelKey: 'nav.teamDay', icon: ClipboardList, ownerOnly: true },
  { to: '/customers', labelKey: 'nav.customers', icon: Building2 },
  { to: '/products', labelKey: 'nav.products', icon: Package },
  { to: '/reports', labelKey: 'nav.reports', icon: ChartColumn },
  { to: '/ai-assistant', labelKey: 'nav.aiAssistant', icon: Sparkles },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]
