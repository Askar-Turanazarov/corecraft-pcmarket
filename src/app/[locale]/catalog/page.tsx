import { PackageSearch } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { db } from '@/lib/db'
import type { Locale } from '@/i18n/routing'
import { ActiveFilters, CatalogFilters } from '@/components/shop/catalog-filters'
import { card, pageTitle } from '@/components/ui/styles'
import { CatalogSort } from '@/components/shop/catalog-sort'
import { Pagination } from '@/components/shop/pagination'
import { ProductCard } from '@/components/shop/product-card'
import { readQuery } from '@/components/shop/query'

const PER_PAGE = 24

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function orderBy(sort: string | undefined, locale: Locale) {
  if (sort === 'price-asc') return { priceUzs: 'asc' as const }
  if (sort === 'price-desc') return { priceUzs: 'desc' as const }
  if (sort === 'name') {
    if (locale === 'uz') return { nameUz: 'asc' as const }
    if (locale === 'en') return { nameEn: 'asc' as const }
    return { nameRu: 'asc' as const }
  }
  return { createdAt: 'desc' as const }
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('catalog')
  const tCat = await getTranslations('catalog.categories')

  const query = readQuery(await searchParams)
  const { category, brand } = query
  const search = query.q?.trim()
  const minPrice = toInt(query.minPrice)
  const maxPrice = toInt(query.maxPrice)
  const page = Math.max(1, toInt(query.page) ?? 1)

  const base = {
    isActive: true,
    // searchText уже в нижнем регистре — так поиск не зависит от регистра и для кириллицы.
    ...(search && { searchText: { contains: search.toLowerCase() } }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      priceUzs: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
  }
  const where = { ...base, ...(category && { category }), ...(brand && { brand }) }

  const [total, products, categoryFacets, brandFacets] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      // id — второй ключ: при равных ценах страницы не должны терять и дублировать товары.
      orderBy: [orderBy(query.sort, locale as Locale), { id: 'asc' }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    // Счётчик категории не должен зависеть от выбранной категории, иначе список схлопнется.
    db.product.groupBy({
      by: ['category'],
      where: { ...base, ...(brand && { brand }) },
      _count: { _all: true },
      orderBy: { category: 'asc' },
    }),
    db.product.groupBy({
      by: ['brand'],
      where: { ...base, ...(category && { category }) },
      _count: { _all: true },
      orderBy: { brand: 'asc' },
    }),
  ])

  // Средняя оценка только для товаров текущей страницы.
  const ratings = await db.review.groupBy({
    by: ['productId'],
    where: { productId: { in: products.map((p) => p.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  })
  const ratingOf = (id: string) => {
    const row = ratings.find((r) => r.productId === id)
    return row ? { avg: row._avg.rating ?? 0, count: row._count._all } : undefined
  }

  const pages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
      <h1 className={pageTitle}>
        {category && tCat.has(category) ? tCat(category) : t('title')}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-10">
        <CatalogFilters
          query={query}
          locale={locale as Locale}
          categories={categoryFacets.map((row) => ({
            value: row.category,
            count: row._count._all,
          }))}
          brands={brandFacets.map((row) => ({ value: row.brand, count: row._count._all }))}
        />

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="tabular text-sm text-muted" aria-live="polite">{t('found', { count: total })}</p>
            <CatalogSort query={query} />
          </div>
          <ActiveFilters query={query} locale={locale as Locale} />

          {products.length === 0 ? (
            <div className={`${card} flex flex-col items-center gap-2 px-6 py-20 text-center`}>
              <PackageSearch className="size-8 text-muted" aria-hidden />
              <p className="font-medium">{t('empty')}</p>
              <p className="text-sm text-muted">{t('emptyHint')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale as Locale} rating={ratingOf(product.id)} />
              ))}
            </div>
          )}

          <Pagination query={query} page={page} pages={pages} />
        </div>
      </div>
    </div>
  )
}
