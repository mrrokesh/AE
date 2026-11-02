import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui'

export interface BarDatum {
  name: string
  value: number
}

/** Small horizontal bar chart. Colours come from design tokens. */
export function BarChartCard({
  title,
  data,
  unit = '',
  empty,
}: {
  title: string
  data: BarDatum[]
  unit?: string
  empty: string
}) {
  const has = data.some((d) => d.value > 0)
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {!has ? (
        <p className="py-8 text-center text-sm text-fg-muted">{empty}</p>
      ) : (
        <div style={{ height: 36 * data.length + 24 }} role="img" aria-label={title}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="var(--color-border)" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: 'var(--color-fg-muted)', fontSize: 11 }}
                stroke="var(--color-border)"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                tick={{ fill: 'var(--color-fg-muted)', fontSize: 11 }}
                stroke="var(--color-border)"
              />
              <Tooltip
                formatter={(v) => `${v}${unit}`}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: 'var(--color-surface-2)' }}
              />
              <Bar
                dataKey="value"
                fill="var(--color-brand-600)"
                radius={[0, 4, 4, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
