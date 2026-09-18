import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { db } from '@/lib/db'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { CategoryIcon } from '@/components/shop/category-icon'
import { productDesc, productName } from '@/components/shop/localized'
import { Price } from '@/components/shop/price'
import { AddToCart } from '@/components/cart/add-to-cart'
import { SpecTable } from '@/components/shop/spec-table'

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

  const inStock = product.stock > 0
  const description = productDesc(product, locale as Locale)
  const categoryKey = `categories.${product.category}`

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {tCatalog('title')}
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* Картинок в базе нет — вместо фото иконка категории. */}
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border bg-surface">
          <CategoryIcon category={product.category} className="size-20 text-muted" />
        </div>

        <div className="space-y-4">
          <span className="text-sm text-muted">
            {tCatalog.has(categoryKey) ? tCatalog(categoryKey) : product.category}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            {productName(product, locale as Locale)}
          </h1>

          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted">{t('brand')}</dt>
              <dd>{product.brand}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">{t('model')}</dt>
              <dd>{product.model}</dd>
            </div>
          </dl>

          <Price
            amountUzs={product.priceUzs}
            oldPriceUzs={product.oldPriceUzs}
            locale={locale as Locale}
            large
          />

          <p className={cn('text-sm', inStock ? 'text-accent' : 'text-muted')}>
            {inStock ? tCatalog('inStock') : tCatalog('outOfStock')}
          </p>

          <AddToCart productId={product.id} stock={product.stock} className="mt-2 w-full sm:w-auto" />
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-3 text-lg font-medium">{t('specs')}</h2>
        <SpecTable product={product} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-medium">{t('description')}</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
          {description || t('noDescription')}
        </p>
      </section>
    </div>
  )
}
