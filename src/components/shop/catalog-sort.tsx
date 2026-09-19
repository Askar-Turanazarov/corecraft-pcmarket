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

/** Сегментированный переключатель: на узком экране прокручивается внутри себя, а не страница. */
export async function CatalogSort({ query }: { query: Query }) {
  const t = await getTranslations('catalog')

  return (
    <nav aria-label={t('sort')} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex gap-1 rounded-[var(--radius-control)] border border-border bg-surface-2 p-1 text-sm">
        {OPTIONS.map(({ value, label }) => {
          const active = (query.sort ?? undefined) === value
          return (
            <Link
              key={label}
              href={catalogHref(query, { sort: value })}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex min-h-10 items-center whitespace-nowrap rounded-[6px] px-3 transition-colors duration-200 sm:min-h-8',
                active ? 'bg-surface font-medium text-foreground ring-1 ring-border' : 'text-muted hover:text-foreground',
              )}
            >
              {t(label)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
