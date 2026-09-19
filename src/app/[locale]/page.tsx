import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Boxes, CheckCircle2, Gauge, LayoutGrid } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { db } from '@/lib/db'
import { cn } from '@/lib/cn'
import { formatUzs } from '@/lib/money'
import { checkBuild } from '@/lib/compat'
import { buildSummary } from '@/lib/build-summary'
import { CategoryIcon } from '@/components/shop/category-icon'
import { ProductCard } from '@/components/shop/product-card'
import { BuildPreview } from '@/components/builder/build-preview'
import { badge, button, card, panel, sectionTitle } from '@/components/ui/styles'
import { builderHref, loadBuild, sceneParts, summaryLabels, type BuildSlugs } from './builder/build'

// Витринная сборка героя: проверена checkBuild — ошибок и предупреждений нет.
const SHOWCASE: BuildSlugs = {
  cpu: ['amd-ryzen-7-9800x3d'],
  motherboard: ['msi-mag-x870-tomahawk-wifi'],
  ram: ['g-skill-trident-z5-neo-rgb-ddr5-32gb-6000'],
  gpu: ['nvidia-geforce-rtx-5080-16gb'],
  storage: ['samsung-990-pro-2tb'],
  cooler: ['arctic-liquid-freezer-iii-360'],
  psu: ['corsair-rm1000x'],
  case: ['lian-li-o11-vision'],
}


export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const [t, tCat, labels, { build, items }, categories, brands, games, prebuilt] = await Promise.all([
    getTranslations('home'),
    getTranslations('catalog.categories'),
    summaryLabels(locale),
    loadBuild(SHOWCASE),
    db.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
    }),
    db.product.groupBy({ by: ['brand'], where: { isActive: true } }),
    db.game.count(),
    db.product.findMany({
      where: { category: 'prebuilt', isActive: true, stock: { gt: 0 } },
      orderBy: { priceUzs: 'asc' },
    }),
  ])

  const compat = checkBuild(build)
  const segments = buildSummary(items, labels)
  const totalUzs = items.reduce((sum, i) => sum + i.product.priceUzs, 0)
  const productCount = categories.reduce((sum, c) => sum + c._count._all, 0)
  const parts = sceneParts(items, locale as Locale)

  // Готовые сборки: сначала свои (CoreCraft), из них — четыре по ступеням цены, от доступной до топовой.
  const own = prebuilt.filter((p) => p.brand === 'CoreCraft')
  const picks =
    own.length >= 4
      ? [0, 1, 2, 3].map((i) => own[Math.round((i * (own.length - 1)) / 3)])
      : [...own, ...prebuilt.filter((p) => p.brand !== 'CoreCraft')].slice(0, 4)
  const ratings = await db.review.groupBy({
    by: ['productId'],
    where: { productId: { in: picks.map((p) => p.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  })
  const ratingOf = (id: string) => {
    const row = ratings.find((r) => r.productId === id)
    return row ? { avg: row._avg.rating ?? 0, count: row._count._all } : undefined
  }

  const catLabel = (c: string) => (tCat.has(c) ? tCat(c) : c)

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* ── Герой: заголовок и живая 3D-сборка ── */}
      <section className="grid items-center gap-10 pb-6 pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:pt-16">
        <div>
          <h1 className="break-words font-display text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[2.75rem]">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t('subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/builder" className={button('primary', 'lg')}>
              {t('ctaBuilder')}
            </Link>
            <Link href="/catalog" className={button('secondary', 'lg')}>
              {t('ctaCatalog')}
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
            {[
              [productCount, t('stats.products', { count: productCount })],
              [games, t('stats.games', { count: games })],
            ].map(([n, label]) => (
              <p key={label}>
                <span className="tabular block font-display text-2xl font-semibold">{n}</span>
                <span className="text-sm text-muted">{label}</span>
              </p>
            ))}
          </div>
        </div>

        <figure className="min-w-0">
          <BuildPreview parts={parts} compact />
          <figcaption className={cn(card, 'mt-3 p-4 sm:p-5')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{t('showcase.title')}</p>
              {compat.errors.length === 0 && (
                <span className={badge('plasma')}>
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {t('showcase.compatible')}
                </span>
              )}
            </div>
            <ul className="tabular mt-3 flex flex-wrap gap-x-2 gap-y-1.5 text-sm text-muted">
              {segments.map((s, i) => (
                <li key={`${s.slot}-${i}`} className="inline-flex items-center gap-1.5">
                  <CategoryIcon category={s.slot} className="size-3.5 text-accent" />
                  <span className="text-foreground">{s.text}</span>
                  {i < segments.length - 1 && (
                    <span aria-hidden className="pl-0.5 text-border">
                      |
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div>
                <p className="tabular font-display text-xl font-semibold">{formatUzs(totalUzs, locale)}</p>
                <p className="tabular text-xs text-muted">{t('showcase.power', { w: compat.powerEstimateW })}</p>
              </div>
              <Link href={builderHref(SHOWCASE)} className={button('secondary')}>
                {t('showcase.open')}
              </Link>
            </div>
          </figcaption>
        </figure>
      </section>

      {/* ── Три пути: конструктор главный, каталог и FPS рядом ── */}
      <section aria-labelledby="paths" className="mt-16 sm:mt-24">
        <h2 id="paths" className="sr-only">
          {t('paths.title')}
        </h2>
        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <Link
            href="/builder"
            className={cn(panel, 'group flex min-w-0 flex-col p-6 transition-colors hover:border-accent/60 sm:p-8 lg:col-span-2 lg:row-span-2')}
          >
            <span className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-accent/40 text-accent">
              <Boxes className="size-5" aria-hidden />
            </span>
            <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t('paths.builder.title')}</h3>
            <p className="mt-3 max-w-xl text-muted">{t('paths.builder.text')}</p>
            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {(['p1', 'p2', 'p3'] as const).map((k) => (
                <li key={k} className="flex gap-2 rounded-[var(--radius-control)] bg-surface-2 p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-plasma" aria-hidden />
                  {t(`paths.builder.${k}`)}
                </li>
              ))}
            </ul>
            <span className={cn(button('primary'), 'mt-8 self-start lg:mt-auto')}>{t('paths.builder.cta')}</span>
          </Link>

          <Link href="/catalog" className={cn(card, 'group flex min-w-0 flex-col p-6 transition-colors hover:border-accent/60')}>
            <div className="flex items-start justify-between gap-4">
              <LayoutGrid className="size-6 text-accent" aria-hidden />
              <span className="tabular text-right text-sm text-muted">
                {t('paths.catalog.meta', { products: productCount, brands: brands.length })}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold">{t('paths.catalog.title')}</h3>
            <p className="mt-2 text-sm text-muted">{t('paths.catalog.text')}</p>
            <span className="mt-4 text-sm font-medium text-accent group-hover:text-accent-strong lg:mt-auto lg:pt-4">
              {t('paths.catalog.cta')}
            </span>
          </Link>

          <Link href="/fps" className={cn(card, 'group flex min-w-0 flex-col p-6 transition-colors hover:border-accent/60')}>
            <div className="flex items-start justify-between gap-4">
              <Gauge className="size-6 text-accent" aria-hidden />
              <span className="tabular font-display text-2xl font-semibold leading-none">{games}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold">{t('paths.fps.title')}</h3>
            <p className="mt-2 text-sm text-muted">{t('paths.fps.text', { count: games })}</p>
            <span className="mt-4 text-sm font-medium text-accent group-hover:text-accent-strong lg:mt-auto lg:pt-4">
              {t('paths.fps.cta')}
            </span>
          </Link>
        </div>
      </section>

      {/* ── Категории: самые большие крупнее ── */}
      <section className="mt-16 sm:mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className={sectionTitle}>{t('categories')}</h2>
          <Link href="/catalog" className={button('ghost', 'sm')}>
            {t('categoriesAll')}
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map(({ category, _count }, i) =>
            i < 2 ? (
              <li key={category} className="col-span-2">
                <Link
                  href={`/catalog?category=${category}`}
                  className={cn(card, 'group flex items-center gap-4 p-5 transition-colors hover:border-accent/60')}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-control)] border border-border bg-surface-2 text-accent">
                    <CategoryIcon category={category} className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1 font-medium">{catLabel(category)}</span>
                  <span className="text-right">
                    <span className="tabular block font-display text-2xl font-semibold leading-none">{_count._all}</span>
                    <span className="text-xs text-muted">{t('categoryCount', { count: _count._all })}</span>
                  </span>
                </Link>
              </li>
            ) : (
              <li key={category}>
                <Link
                  href={`/catalog?category=${category}`}
                  className="group flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent/60 hover:bg-surface"
                >
                  <CategoryIcon category={category} className="size-4.5 shrink-0 text-muted group-hover:text-accent" />
                  <span className="min-w-0 flex-1 leading-tight">{catLabel(category)}</span>
                  <span className="tabular text-muted">{_count._all}</span>
                </Link>
              </li>
            ),
          )}
        </ul>
      </section>

      {/* ── Готовые сборки ── */}
      {picks.length > 0 && (
        <section className="mt-16 sm:mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1.5">
              <h2 className={sectionTitle}>{t('ready.title')}</h2>
              <p className="max-w-2xl text-sm text-muted">{t('ready.text')}</p>
            </div>
            <Link href="/catalog?category=prebuilt" className={button('ghost', 'sm')}>
              {t('ready.all')}
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} rating={ratingOf(p.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
