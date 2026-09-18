import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { Locale } from '@/i18n/routing'
import { CategoryIcon } from './category-icon'
import { productName } from './localized'
import { Price } from './price'
import { Stars } from './reviews'

type Props = {
  product: {
    slug: string
    category: string
    brand: string
    stock: number
    priceUzs: number
    oldPriceUzs: number | null
    nameRu: string
    nameUz: string
    nameEn: string
  }
  locale: Locale
  rating?: { avg: number; count: number }
}

export async function ProductCard({ product, locale, rating }: Props) {
  const t = await getTranslations('catalog')
  const inStock = product.stock > 0

  return (
    <Link
      href={`/catalog/${product.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/50"
    >
      {/* Картинок в базе нет — вместо фото иконка категории. */}
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-surface-2">
        <CategoryIcon
          category={product.category}
          className="size-10 text-muted transition-colors group-hover:text-accent"
        />
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <span className="text-xs text-muted">{product.brand}</span>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-accent">
          {productName(product, locale)}
        </h3>
        {rating && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Stars value={rating.avg} label={t('rating', { avg: rating.avg.toFixed(1) })} />
            {rating.count}
          </span>
        )}
        <Price
          amountUzs={product.priceUzs}
          oldPriceUzs={product.oldPriceUzs}
          locale={locale}
          className="mt-auto pt-2"
        />
        <span className={cn('text-xs', inStock ? 'text-accent' : 'text-muted')}>
          {inStock ? t('inStock') : t('outOfStock')}
        </span>
      </div>
    </Link>
  )
}
