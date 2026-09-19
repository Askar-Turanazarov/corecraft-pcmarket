import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { Locale } from '@/i18n/routing'
import { badge, card } from '@/components/ui/styles'
import { CategoryIcon } from './category-icon'
import { keySpecs } from './key-specs'
import { productName } from './localized'
import { Price } from './price'
import { Stars } from './reviews'
import { unitLabels } from './unit-labels'

type Props = {
  // Поля для keySpecs — вызывающие передают товар из Prisma целиком.
  product: Parameters<typeof keySpecs>[0] & {
    slug: string
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
  const [t, units] = await Promise.all([getTranslations('catalog'), unitLabels()])
  const inStock = product.stock > 0
  const specs = keySpecs(product, units).slice(0, 3)

  return (
    <Link
      href={`/catalog/${product.slug}`}
      className={cn(card, 'flex flex-col p-3 transition-colors duration-200 hover:border-accent/60')}
    >
      {/* Картинок в базе нет — вместо фото иконка категории в мягком свете. */}
      <div className="glow flex aspect-[4/3] items-center justify-center rounded-[var(--radius-control)] bg-surface-2">
        <CategoryIcon category={product.category} className="size-11 text-foreground/80" />
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <span className="text-xs text-muted">{product.brand}</span>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5">{productName(product, locale)}</h3>
        {specs.length > 0 && (
          <p className="tabular flex flex-wrap gap-x-2 text-xs text-muted">
            {specs.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </p>
        )}
        {rating && (
          <span className="tabular flex items-center gap-1.5 text-xs text-muted">
            <Stars value={rating.avg} label={t('rating', { avg: rating.avg.toFixed(1) })} className="[&_svg]:size-3.5" />
            {rating.count}
          </span>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          <Price amountUzs={product.priceUzs} oldPriceUzs={product.oldPriceUzs} locale={locale} />
          <span className={badge(inStock ? 'plasma' : 'neutral')}>{inStock ? t('inStock') : t('outOfStock')}</span>
        </div>
      </div>
    </Link>
  )
}
