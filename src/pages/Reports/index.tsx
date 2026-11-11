import { Download, IndianRupee, ReceiptText, ShoppingBag, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button, Tabs } from '@/components/ui'
import { downloadCsv } from '@/features/leads/csv'
import { ConversionCard } from '@/features/reports/components/ConversionCard'
import { RevenueTrend } from '@/features/reports/components/RevenueTrend'
import { SalesBreakdowns } from '@/features/reports/components/SalesBreakdowns'
import { salesToCsv } from '@/features/reports/csv'
import { RANGES } from '@/features/reports/sales'
import { useSalesReport } from '@/features/reports/useSalesReport'
import { formatINR, formatINRCompact } from '@/lib/format'

export default function Reports() {
  const { t } = useTranslation()
  const { range, setRange, sales, report, users } = useSalesReport()
  const exportCsv = () =>
    downloadCsv(
      `anita-sales-${range}-${new Date().toISOString().slice(0, 10)}.csv`,
      salesToCsv(sales, users, t),
    )

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        actions={
          <Button onClick={exportCsv} disabled={sales.length === 0}>
            <Download className="size-4" />
            <span className="hidden sm:inline">{t('reports.export')}</span>
          </Button>
        }
      />
      <div className="mb-4 overflow-x-auto">
        <Tabs
          items={RANGES.map((id) => ({ id, label: t(`reports.range.${id}`) }))}
          value={range}
          onChange={setRange}
        />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('reports.stat.revenue')}
          value={formatINRCompact(report.revenue)}
          hint={formatINR(report.revenue)}
          icon={IndianRupee}
        />
        <StatCard
          label={t('reports.stat.orders')}
          value={String(report.orders)}
          hint={t('reports.units', { count: report.units })}
          icon={ShoppingBag}
        />
        <StatCard
          label={t('reports.stat.avgOrder')}
          value={formatINRCompact(report.avgOrder)}
          icon={ReceiptText}
        />
        <StatCard label={t('reports.stat.buyers')} value={String(report.buyers)} icon={Users} />
      </div>
      <div className="mb-4">
        <RevenueTrend trend={report.trend} />
      </div>
      <ConversionCard />
      <SalesBreakdowns report={report} users={users} />
    </>
  )
}
