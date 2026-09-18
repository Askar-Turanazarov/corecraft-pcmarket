import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { catalogHref, type Query } from './query'

const OPTIONS = [
  { value: undefined, label: 'sortNew' },
  { value: 'price-asc', label: 'sortPriceAsc' },
  { value: 'price-desc', label: 'sortPriceDesc' },
  { value: 'name', label: 'sortName' },
] as const

export async function CatalogSort({ query }: { query: Query }) {
  const t = await getTranslations('catalog')

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted">{t('sort')}</span>
      {OPTIONS.map(({ value, label }) => (
        <Link
          key={label}
          href={catalogHref(query, { sort: value })}
          className={cn(
            'rounded-full border border-border px-3 py-1 hover:bg-surface',
            (query.sort ?? undefined) === value && 'border-accent text-accent',
          )}
        >
          {t(label)}
        </Link>
      ))}
    </div>
  )
}
