import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronRight, Scale } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { db } from '@/lib/db'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { catalogHref } from '@/components/shop/query'
import { CategoryIcon } from '@/components/shop/category-icon'
import { productDesc, productName } from '@/components/shop/localized'
import { Price } from '@/components/shop/price'
import { AddToCart } from '@/components/cart/add-to-cart'
import { SpecTable, parseObject as parseSpecs } from '@/components/shop/spec-table'
import { Reviews, Stars } from '@/components/shop/reviews'
import { keySpecs } from '@/components/shop/key-specs'
import { unitLabels } from '@/components/shop/unit-labels'
import { badge, button, card, panel, sectionTitle } from '@/components/ui/styles'
import { FpsWidget } from '@/components/fps/fps-widget'
import { rigFromParts } from '@/lib/fps'
import { readCompare } from '@/lib/compare'
import { toggleCompare } from '../../compare/actions'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const product = await db.product.findUnique({
    where: { slug },
    select: { nameRu: true, nameUz: true, nameEn: true },
  })
  if (!product) return {}
  return { title: productName(product, locale as Locale) }
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('product')
  const tCatalog = await getTranslations('catalog')

  const product = await db.product.findUnique({ where: { slug } })
  if (!product || !product.isActive) notFound()

  const [inCompare, units, rating, tReviews] = await Promise.all([
    readCompare().then((slugs) => slugs.includes(product.slug)),
    unitLabels(),
    db.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: { _all: true } }),
    getTranslations('reviews'),
  ])
  const inStock = product.stock > 0
  const description = productDesc(product, locale as Locale)
  const categoryKey = `categories.${product.category}`
  const categoryName = tCatalog.has(categoryKey) ? tCatalog(categoryKey) : product.category
  const name = productName(product, locale as Locale)
  const specs = keySpecs(product, units)
  const reviewCount = rating._count._all
  const isSystem = product.kind === 'PREBUILT' || product.kind === 'LAPTOP'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <nav aria-label={t('breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link href="/catalog" className="inline-flex min-h-9 items-center hover:text-foreground">
              {tCatalog('title')}
            </Link>
          </li>
          <li aria-hidden><ChevronRight className="size-4" /></li>
          <li>
            <Link href={catalogHref({}, { category: product.category })} className="inline-flex min-h-9 items-center hover:text-foreground">
              {categoryName}
            </Link>
          </li>
          <li aria-hidden className="max-sm:hidden"><ChevronRight className="size-4" /></li>
          <li aria-current="page" className="line-clamp-1 text-foreground max-sm:hidden">{name}</li>
        </ol>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
        {/* Картинок в базе нет — вместо фото иконка категории в мягком свете. */}
        <div className={cn(panel, 'glow flex aspect-[4/3] sm:aspect-[16/9] items-center justify-center lg:col-start-1 lg:row-start-1')}>
          <CategoryIcon category={product.category} className="size-24 text-foreground/80 sm:size-32" />
        </div>

        {/* Блок покупки занимает всю высоту правой колонки и липнет под шапкой. */}
        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className={cn(panel, 'space-y-5 p-5 sm:p-6 lg:sticky lg:top-24')}>
            <div className="space-y-2">
              <p className="text-sm text-muted">
                {product.brand} · {categoryName}
              </p>
              <h1 className="font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{name}</h1>
              {reviewCount > 0 && (
                <a href="#reviews" className="tabular inline-flex min-h-9 items-center gap-2 text-sm text-muted hover:text-foreground">
                  <Stars value={rating._avg.rating ?? 0} />
                  {tReviews('summary', { avg: (rating._avg.rating ?? 0).toFixed(1), count: reviewCount })}
                </a>
              )}
            </div>

            {specs.length > 0 && (
              <ul aria-label={t('keySpecs')} className="tabular flex flex-wrap gap-2">
                {specs.map((s) => (
                  <li key={s} className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium">
                    {s}
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-3 border-t border-border pt-5">
              <Price amountUzs={product.priceUzs} oldPriceUzs={product.oldPriceUzs} locale={locale as Locale} large />
              <span className={badge(inStock ? 'plasma' : 'neutral')}>
                {inStock ? tCatalog('inStock') : tCatalog('outOfStock')}
              </span>
            </div>

            <div className="space-y-2">
              <AddToCart productId={product.id} stock={product.stock} size="lg" className="w-full" />
              <form action={toggleCompare.bind(null, product.slug)}>
                <button type="submit" aria-pressed={inCompare} className={button('secondary', 'lg', 'w-full')}>
                  <Scale className={cn('size-4', inCompare && 'text-accent')} aria-hidden />
                  {inCompare ? t('inCompare') : t('compare')}
                </button>
              </form>
              {inCompare && (
                <Link href="/compare" className="flex min-h-11 items-center justify-center text-sm text-accent hover:underline">
                  {t('openCompare')}
                </Link>
              )}
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border pt-4 text-sm">
              <dt className="text-muted">{t('brand')}</dt>
              <dd>{product.brand}</dd>
              <dt className="text-muted">{t('model')}</dt>
              <dd className="break-words">{product.model}</dd>
            </dl>
          </div>
        </aside>

        <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-2">
          {/* Готовые ПК и ноутбуки — целая система, для неё сразу видно FPS. */}
          {isSystem && (
            <FpsWidget
              locale={locale as Locale}
              rig={rigFromParts({
                cpu: product,
                gpu: { ...product, brand: String(parseSpecs(product.specs).gpuVendor ?? product.brand) },
                ram: product,
                drive: product,
              })}
            />
          )}

          <section>
            <h2 className={cn(sectionTitle, 'mb-4')}>{t('specs')}</h2>
            <div className={cn(card, 'px-4 py-1 sm:px-5')}>
              <SpecTable product={product} />
            </div>
          </section>

          <section>
            <h2 className={cn(sectionTitle, 'mb-4')}>{t('description')}</h2>
            <p className="max-w-prose whitespace-pre-line leading-relaxed text-muted">
              {description || t('noDescription')}
            </p>
          </section>

          <Reviews productId={product.id} slug={product.slug} locale={locale as Locale} />
        </div>
      </div>
    </div>
  )
}
