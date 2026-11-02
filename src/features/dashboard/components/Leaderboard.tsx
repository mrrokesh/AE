import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, Card } from '@/components/ui'
import type { OwnerStats } from '../stats'

export function Leaderboard({ rows }: { rows: OwnerStats['leaderboard'] }) {
  const { t } = useTranslation()
  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Trophy className="size-4 text-warning" />
        {t('dashboard.leaderboard')}
      </h2>
      <ol className="space-y-2.5">
        {rows.map((r, i) => (
          <li key={r.user.id} className="flex items-center gap-3">
            <span className="w-4 text-sm font-semibold text-fg-muted">{i + 1}</span>
            <Avatar name={r.user.name} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm">{r.user.name}</span>
            <span className="text-xs text-fg-muted">
              {t('dashboard.openLeads', { count: r.open })}
            </span>
            <span className="w-16 text-right text-sm font-semibold">
              {t('dashboard.wonCount', { count: r.won })}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
