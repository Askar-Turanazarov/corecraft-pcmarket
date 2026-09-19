import { getTranslations } from 'next-intl/server'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { Link, getPathname } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { formatUzs } from '@/lib/money'
import type { Locale } from '@/i18n/routing'
import { button, field } from '@/components/ui/styles'
import { CategoryIcon } from './category-icon'
import { catalogHref, type Query } from './query'

export type Facet = { value: string; count: number }

const FILTER_KEYS = ['q', 'category', 'brand', 'minPrice', 'maxPrice'] as const

const rowClass = (active: boolean) =>
  cn(
    'flex min-h-10 items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 transition-colors duration-200',
    active ? 'bg-surface-2 font-medium text-foreground' : 'text-muted hover:bg-surface-2 hover:text-foreground',
  )

const count = 'tabular ml-auto text-xs text-muted'

/**
 * Фильтры: на широком экране — боковая колонка, на узком — сворачиваемая панель.
 * Один нативный <details> без JS; на lg содержимое показываем всегда через ::details-content.
 */
export async function CatalogFilters({
  query,
  locale,
  categories,
  brands,
}: {
  query: Query
  locale: Locale
  categories: Facet[]
  brands: Facet[]
}) {
  const t = await getTranslations('catalog')
  const active = FILTER_KEYS.filter((key) => query[key]).length

  return (
    <details className="group rounded-[var(--radius-card)] border border-border bg-surface lg:self-start lg:border-0 lg:bg-transparent lg:[&::details-content]:[content-visibility:visible]">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-medium lg:hidden [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="size-4 text-muted" aria-hidden />
        {t('filters')}
        {active > 0 && <span className="tabular rounded-full bg-accent px-2 text-xs leading-5 text-on-accent">{active}</span>}
        <ChevronDown className="ml-auto size-4 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>

      <div className="space-y-7 border-t border-border p-4 text-sm lg:border-0 lg:p-0">
        {/* GET-форма отправляет только свои поля, поэтому остальные фильтры несём скрытыми. */}
        <form action={getPathname({ href: '/catalog', locale })} className="space-y-4">
          {(['category', 'brand', 'sort'] as const)
            .filter((key) => query[key])
            .map((key) => (
              <input key={key} type="hidden" name={key} defaultValue={query[key]} />
            ))}

          <label className="block space-y-1.5">
            <span className="font-medium">{t('search')}</span>
            <input
              name="q"
              type="search"
              defaultValue={query.q}
              placeholder={t('searchPlaceholder')}
              className={field}
            />
          </label>

          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 font-medium">{t('price')}</legend>
            <div className="flex gap-2">
              <input
                name="minPrice"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={query.minPrice}
                placeholder={t('priceFrom')}
                aria-label={`${t('price')} ${t('priceFrom')}`}
                className={cn(field, 'tabular')}
              />
              <input
                name="maxPrice"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={query.maxPrice}
                placeholder={t('priceTo')}
                aria-label={`${t('price')} ${t('priceTo')}`}
                className={cn(field, 'tabular')}
              />
            </div>
          </fieldset>

          <button type="submit" className={button('secondary', 'md', 'w-full')}>
            {t('apply')}
          </button>
        </form>

        {categories.length > 0 && (
          <section>
            <h3 className="mb-2 font-medium">{t('category')}</h3>
            <ul className="space-y-0.5">
              <li>
                <Link href={catalogHref(query, { category: undefined })} className={rowClass(!query.category)}>
                  {t('allCategories')}
                </Link>
              </li>
              {categories.map(({ value, count: n }) => (
                <li key={value}>
                  <Link
                    href={catalogHref(query, { category: value })}
                    aria-current={query.category === value ? 'true' : undefined}
                    className={rowClass(query.category === value)}
                  >
                    <CategoryIcon category={value} className="size-4 shrink-0" />
                    <span className="truncate">
                      {t.has(`categories.${value}`) ? t(`categories.${value}`) : value}
                    </span>
                    <span className={count}>{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {brands.length > 0 && (
          <section>
            <h3 className="mb-2 font-medium">{t('brand')}</h3>
            <ul className="space-y-0.5">
              <li>
                <Link href={catalogHref(query, { brand: undefined })} className={rowClass(!query.brand)}>
                  {t('allBrands')}
                </Link>
              </li>
              {brands.map(({ value, count: n }) => (
                <li key={value}>
                  <Link
                    href={catalogHref(query, { brand: value })}
                    aria-current={query.brand === value ? 'true' : undefined}
                    className={rowClass(query.brand === value)}
                  >
                    <span className="truncate">{value}</span>
                    <span className={count}>{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </details>
  )
}

/** Активные фильтры чипами: каждый — ссылка на тот же каталог без этого фильтра. */
export async function ActiveFilters({ query, locale }: { query: Query; locale: Locale }) {
  const t = await getTranslations('catalog')
  const label = (key: (typeof FILTER_KEYS)[number], value: string) => {
    if (key === 'category') return t.has(`categories.${value}`) ? t(`categories.${value}`) : value
    if (key === 'q') return `«${value}»`
    const amount = Number(value)
    const price = Number.isFinite(amount) ? formatUzs(amount, locale) : value
    return `${key === 'minPrice' ? t('priceFrom') : t('priceTo')} ${price}`
  }
  const chips = FILTER_KEYS.flatMap((key) => (query[key] ? [{ key, text: label(key, query[key]) }] : []))
  if (chips.length === 0) return null

  return (
    <ul aria-label={t('activeFilters')} className="flex flex-wrap items-center gap-2">
      {chips.map(({ key, text }) => (
        <li key={key}>
          <Link
            href={catalogHref(query, { [key]: undefined })}
            aria-label={t('removeFilter', { name: text })}
            className="tabular inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent/40 bg-surface pl-3 pr-2 text-sm transition-colors duration-200 hover:border-accent"
          >
            {text}
            <X className="size-3.5 text-muted" aria-hidden />
          </Link>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <Link
            href={catalogHref({ sort: query.sort }, {})}
            className="inline-flex min-h-9 items-center px-2 text-sm text-muted hover:text-foreground"
          >
            {t('reset')}
          </Link>
        </li>
      )}
    </ul>
  )
}
