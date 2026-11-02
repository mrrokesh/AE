import { useState } from 'react'
import { LayoutGrid, List, PackageSearch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { Button, Card, EmptyState } from '@/components/ui'
import { useWaitingCounts } from '@/features/products/useWaiting'
import { ProductCard } from '@/features/products/components/ProductCard'
import { ProductFilterBar } from '@/features/products/components/ProductFilterBar'
import { ProductsTable } from '@/features/products/components/ProductsTable'
import { useProductBrowser } from '@/features/products/useProductBrowser'

export default function Products() {
  const { t } = useTranslation()
  const b = useProductBrowser()
  const waiting = useWaitingCounts()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const grid = view === 'grid'
  return (
    <>
      <PageHeader
        title={t('pages.products.title')}
        description={t('catalog.description', { count: b.counts.all })}
        actions={
          <div className="hidden gap-1 md:flex">
            <Button
              variant={grid ? 'primary' : 'secondary'}
              aria-label={t('catalog.view.grid')}
              aria-pressed={grid}
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={grid ? 'secondary' : 'primary'}
              aria-label={t('catalog.view.table')}
              aria-pressed={!grid}
              onClick={() => setView('table')}
            >
              <List className="size-4" />
            </Button>
          </div>
        }
      />
      <ProductFilterBar
        filters={b.filters}
        brands={b.brands}
        counts={b.counts}
        onChange={b.update}
      />
      {b.total === 0 ? (
        <Card>
          <EmptyState
            icon={PackageSearch}
            title={t('catalog.emptyTitle')}
            description={t('catalog.emptyText')}
          />
        </Card>
      ) : (
        <>
          <div className={grid ? '' : 'md:hidden'}>
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {b.rows.map((p) => (
                <ProductCard key={p.id} product={p} waiting={waiting.get(p.id) ?? 0} />
              ))}
            </div>
          </div>
          {!grid && (
            <Card className="hidden overflow-hidden md:block">
              <ProductsTable rows={b.rows} waiting={waiting} />
            </Card>
          )}
          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-fg-muted">
            <span>{t('catalog.showing', { shown: b.rows.length, total: b.total })}</span>
            {b.hasMore && <Button onClick={b.showMore}>{t('catalog.showMore')}</Button>}
          </div>
        </>
      )}
    </>
  )
}
