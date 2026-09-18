import { getTranslations } from 'next-intl/server'
import { Link, getPathname } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { Locale } from '@/i18n/routing'
import { CategoryIcon } from './category-icon'
import { catalogHref, type Query } from './query'

export type Facet = { value: string; count: number }

const rowClass = (active: boolean) =>
  cn(
    'flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2',
    active && 'bg-surface-2 text-accent',
  )

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
  const hasFilters = Object.keys(query).some((key) => key !== 'sort' && key !== 'page')

  return (
    <aside className="space-y-6 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t('filters')}</h2>
        {hasFilters && (
          <Link href="/catalog" className="text-xs text-muted hover:text-foreground">
            {t('reset')}
          </Link>
        )}
      </div>

      {/* GET-форма отправляет только свои поля, поэтому остальные фильтры несём скрытыми. */}
      <form action={getPathname({ href: '/catalog', locale })} className="space-y-3">
        {(['category', 'brand', 'sort'] as const)
          .filter((key) => query[key])
          .map((key) => (
            <input key={key} type="hidden" name={key} defaultValue={query[key]} />
          ))}

        <label className="block space-y-1.5">
          <span className="text-muted">{t('search')}</span>
          <input
            name="q"
            defaultValue={query.q}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <fieldset className="space-y-1.5">
          <legend className="text-muted">{t('price')}</legend>
          <div className="flex gap-2">
            <input
              name="minPrice"
              type="number"
              min={0}
              defaultValue={query.minPrice}
              placeholder={t('priceFrom')}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
            />
            <input
              name="maxPrice"
              type="number"
              min={0}
              defaultValue={query.maxPrice}
              placeholder={t('priceTo')}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
            />
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-lg border border-border py-2 font-medium hover:bg-surface"
        >
          {t('apply')}
        </button>
      </form>

      {categories.length > 0 && (
        <section>
          <h3 className="mb-2 font-medium">{t('category')}</h3>
          <ul>
            <li>
              <Link
                href={catalogHref(query, { category: undefined })}
                className={rowClass(!query.category)}
              >
                {t('allCategories')}
              </Link>
            </li>
            {categories.map(({ value, count }) => (
              <li key={value}>
                <Link
                  href={catalogHref(query, { category: value })}
                  className={rowClass(query.category === value)}
                >
                  <CategoryIcon category={value} className="size-4 shrink-0" />
                  <span className="truncate">
                    {t.has(`categories.${value}`) ? t(`categories.${value}`) : value}
                  </span>
                  <span className="ml-auto text-xs text-muted">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {brands.length > 0 && (
        <section>
          <h3 className="mb-2 font-medium">{t('brand')}</h3>
          <ul>
            <li>
              <Link
                href={catalogHref(query, { brand: undefined })}
                className={rowClass(!query.brand)}
              >
                {t('allBrands')}
              </Link>
            </li>
            {brands.map(({ value, count }) => (
              <li key={value}>
                <Link
                  href={catalogHref(query, { brand: value })}
                  className={rowClass(query.brand === value)}
                >
                  <span className="truncate">{value}</span>
                  <span className="ml-auto text-xs text-muted">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
