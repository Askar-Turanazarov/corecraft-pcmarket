import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Scale, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { button, pageTitle, panel } from '@/components/ui/styles'
import { CategoryIcon } from '@/components/shop/category-icon'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { db } from '@/lib/db'
import { readCompare } from '@/lib/compare'
import { productName } from '@/components/shop/localized'
import { Price } from '@/components/shop/price'
import { specRows } from '@/components/shop/spec-table'
import { AddToCart } from '@/components/cart/add-to-cart'
import { toggleCompare } from './actions'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'compare' })
  return { title: t('title') }
}

export default async function ComparePage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)
  const t = await getTranslations('compare')

  const slugs = await readCompare()
  const found = await db.product.findMany({ where: { slug: { in: slugs }, isActive: true } })
  // В порядке добавления, а не как вернула база.
  const products = slugs.flatMap((s) => found.filter((p) => p.slug === s))

  if (products.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <div className={cn(panel, 'glow flex flex-col items-center px-6 py-14 text-center')}>
          <Scale className="size-8 text-muted" aria-hidden />
          <h1 className={cn(pageTitle, 'mt-4')}>{t('title')}</h1>
          <p className="mt-3 max-w-md text-muted">{t('empty')}</p>
          <Link href="/catalog" className={button('primary', 'md', 'mt-6')}>
            {t('toCatalog')}
          </Link>
        </div>
      </section>
    )
  }

  // Сводим характеристики по подписи: строка есть, если она есть хотя бы у одного товара.
  const rows = await Promise.all(products.map((p) => specRows(p)))
  const labels = [...new Set(rows.flatMap((r) => r.map(([label]) => label)))]
  const valueOf = (i: number, label: string) => rows[i].find(([l]) => l === label)?.[1] ?? '—'

  // Первая колонка липнет при горизонтальной прокрутке на широких экранах.
  const stickyCol = 'md:sticky md:left-0 md:z-10'

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
      <h1 className={pageTitle}>{t('title')}</h1>
      <div className="relative mt-8 overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
        <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="align-top">
              <th scope="col" className={cn(stickyCol, 'w-36 border-b border-border bg-surface px-4 py-4 text-left sm:w-48')}>
                <span className="sr-only">{t('spec')}</span>
              </th>
              {products.map((p) => (
                <th key={p.id} scope="col" className="min-w-48 border-b border-border px-4 py-4 text-left font-normal">
                  <div className="flex items-start gap-2">
                    <div className="glow flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-2">
                      <CategoryIcon category={p.category} className="size-6 text-foreground/80" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs text-muted">{p.brand}</span>
                      <Link href={`/catalog/${p.slug}`} className="line-clamp-2 font-medium hover:text-accent">
                        {productName(p, locale)}
                      </Link>
                    </div>
                    <form action={toggleCompare.bind(null, p.slug)} className="-mr-2 -mt-2">
                      <button type="submit" aria-label={t('remove')} className={cn(button('ghost', 'sm'), 'min-h-11 min-w-11 px-0 hover:text-danger')}>
                        <X className="size-4" aria-hidden />
                      </button>
                    </form>
                  </div>
                  <Price amountUzs={p.priceUzs} oldPriceUzs={p.oldPriceUzs} locale={locale} className="mt-3" />
                  <div className="mt-3">
                    <AddToCart productId={p.id} stock={p.stock} size="sm" className="w-full" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => {
              const values = products.map((_, i) => valueOf(i, label))
              const differs = products.length > 1 && new Set(values).size > 1
              return (
                <tr key={label} className="group">
                  <th
                    scope="row"
                    className={cn(
                      stickyCol,
                      'border-b border-border px-4 py-2.5 text-left align-top font-normal group-last:border-0',
                      differs ? 'bg-surface-2 text-foreground' : 'bg-surface text-muted',
                    )}
                  >
                    <span className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className={cn('mt-[7px] size-1.5 shrink-0 rounded-full', differs ? 'bg-accent' : 'bg-transparent')}
                      />
                      {label}
                    </span>
                  </th>
                  {values.map((value, i) => (
                    <td
                      key={products[i].id}
                      className={cn(
                        'tabular border-b border-border px-4 py-2.5 align-top group-last:border-0',
                        differs ? 'bg-surface-2 font-medium' : 'text-muted',
                      )}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
        {t('hint')}
      </p>
    </div>
  )
}
