import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Boxes, Gauge, Send } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { db } from '@/lib/db'
import { CategoryIcon } from '@/components/shop/category-icon'

const FEATURES = [
  { key: 'builder', href: '/builder', Icon: Boxes },
  { key: 'fps', href: '/fps', Icon: Gauge },
  { key: 'telegram', href: '/catalog', Icon: Send },
] as const

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, tCat, categories] = await Promise.all([
    getTranslations('home'),
    getTranslations('catalog.categories'),
    db.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="py-20 sm:py-24">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{t('title')}</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{t('subtitle')}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/builder" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-on-accent hover:bg-accent-strong">
            {t('ctaBuilder')}
          </Link>
          <Link href="/catalog" className="rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-surface">
            {t('ctaCatalog')}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ key, href, Icon }) => (
          <Link key={key} href={href} className="rounded-xl border border-border bg-surface p-5 hover:border-accent/50">
            <Icon className="size-6 text-accent" aria-hidden />
            <h2 className="mt-4 font-medium">{t(`features.${key}.title`)}</h2>
            <p className="mt-2 text-sm text-muted">{t(`features.${key}.text`)}</p>
          </Link>
        ))}
      </section>

      <section className="py-16">
        <h2 className="text-xl font-semibold">{t('categories')}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {categories.map(({ category, _count }) => (
            <Link
              key={category}
              href={`/catalog?category=${category}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center text-sm hover:border-accent/50"
            >
              <CategoryIcon category={category} className="size-7 text-muted group-hover:text-accent" />
              <span>{tCat.has(category) ? tCat(category) : category}</span>
              <span className="text-xs text-muted">{_count._all}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
