import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { X } from 'lucide-react'
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
      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-3 text-muted">{t('empty')}</p>
        <Link href="/catalog" className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:bg-accent-strong">
          {t('toCatalog')}
        </Link>
      </section>
    )
  }

  // Сводим характеристики по подписи: строка есть, если она есть хотя бы у одного товара.
  const rows = await Promise.all(products.map((p) => specRows(p)))
  const labels = [...new Set(rows.flatMap((r) => r.map(([label]) => label)))]
  const valueOf = (i: number, label: string) => rows[i].find(([l]) => l === label)?.[1] ?? '—'

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <div className="relative mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="bg-surface align-top">
              <th className="w-48 px-4 py-3" />
              {products.map((p) => (
                <th key={p.id} scope="col" className="px-4 py-3 text-left font-normal">
                  <div className="flex items-start gap-2">
                    <Link href={`/catalog/${p.slug}`} className="flex-1 font-medium hover:text-accent">
                      {productName(p, locale)}
                    </Link>
                    <form action={toggleCompare.bind(null, p.slug)}>
                      <button type="submit" aria-label={t('remove')} className="text-muted hover:text-danger">
                        <X className="size-4" />
                      </button>
                    </form>
                  </div>
                  <Price amountUzs={p.priceUzs} locale={locale} className="mt-2" />
                  <AddToCart productId={p.id} stock={p.stock} className="mt-3 px-3 py-1.5 text-sm" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {labels.map((label) => {
              const values = products.map((_, i) => valueOf(i, label))
              const differs = new Set(values).size > 1
              return (
                <tr key={label}>
                  <th scope="row" className="px-4 py-2 text-left font-normal text-muted">{label}</th>
                  {values.map((value, i) => (
                    <td key={products[i].id} className={differs ? 'px-4 py-2 font-medium' : 'px-4 py-2'}>
                      {value}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">{t('hint')}</p>
    </div>
  )
}
