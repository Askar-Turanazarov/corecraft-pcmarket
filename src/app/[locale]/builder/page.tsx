import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AlertTriangle, CheckCircle2, Plus, X, XCircle, Zap } from 'lucide-react'
import { db } from '@/lib/db'
import { cn } from '@/lib/cn'
import { formatUzs } from '@/lib/money'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { SLOTS, checkBuild, candidateErrors, type Issue, type Slot } from '@/lib/compat'
import { CategoryIcon } from '@/components/shop/category-icon'
import { productName } from '@/components/shop/localized'
import { Price } from '@/components/shop/price'
import { BuildPreview, type ScenePart } from '@/components/builder/build-preview'
import { MAX_STORAGE, builderHref, isSlot, loadBuild, readBuildSlugs } from './build'
import { addBuildToCart, saveBuild } from './actions'

// Порядок, в котором сборщик ставит детали в корпус, — по нему идёт таймлайн 3D-сцены.
const ASSEMBLY: Slot[] = ['case', 'psu', 'motherboard', 'cpu', 'cooler', 'ram', 'storage', 'gpu']

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'builder' })
  return { title: t('title') }
}

export default async function BuilderPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)
  const [t, tc, tCat] = await Promise.all([
    getTranslations('builder'),
    getTranslations('compat'),
    getTranslations('catalog.categories'),
  ])

  const raw = await searchParams
  const slugs = readBuildSlugs(raw)
  const pick = isSlot(raw.pick) ? raw.pick : undefined
  const saved = typeof raw.saved === 'string' ? raw.saved : undefined

  const { build, items } = await loadBuild(slugs)
  const compat = checkBuild(build)
  const totalUzs = items.reduce((sum, i) => sum + i.product.priceUzs, 0)
  const issueText = (issue: Issue) => tc(issue.key, issue.params)

  // Подборщик: сначала совместимые (дешевле выше), несовместимые ниже — с причиной.
  const pickRows = pick
    ? (
        await db.product.findMany({
          where: { kind: 'COMPONENT', category: pick, isActive: true },
          orderBy: [{ priceUzs: 'asc' }, { id: 'asc' }],
        })
      )
        .map((product) => ({ product, errors: candidateErrors(build, pick, product) }))
        .sort((a, b) => Number(a.errors.length > 0) - Number(b.errors.length > 0))
    : []

  // Абсолютная ссылка для «поделиться» — с того же хоста, на котором открыт магазин.
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  const sceneParts: ScenePart[] = ASSEMBLY.flatMap((slot) =>
    items
      .filter((i) => i.slot === slot)
      .map(({ product }) => ({
        slot,
        name: productName(product, locale),
        formFactor: product.formFactor,
        lengthMm: product.lengthMm,
        heightMm: product.heightMm,
        memorySticks: product.memorySticks,
        coolerType: product.coolerType,
        radiatorMm: product.radiatorMm,
        storageType: product.storageType,
      })),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-muted">{t('subtitle')}</p>
        </div>
        {items.length > 0 && (
          <Link href="/builder" className="text-sm text-muted hover:text-foreground">
            {t('reset')}
          </Link>
        )}
      </div>

      {saved && (
        <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <p className="font-medium">{t('saved')}</p>
          <input
            readOnly
            aria-label={t('shareLink')}
            value={`${origin}/${locale}/builder/${saved}`}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-muted"
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_26rem]">
        {/* ── Слоты ── */}
        <div className="space-y-3">
          {SLOTS.map((slot) => {
            const chosen = items.filter((i) => i.slot === slot)
            const canAdd = slot === 'storage' ? chosen.length < MAX_STORAGE : chosen.length === 0
            return (
              <section key={slot} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={slot} className="size-5 text-muted" />
                  <h2 className="font-medium">{t(`slots.${slot}`)}</h2>
                  {canAdd && (
                    <Link
                      href={builderHref(slugs, {}, { pick: slot })}
                      scroll={false}
                      className="ml-auto flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      <Plus className="size-4" />
                      {chosen.length === 0 ? t('choose') : t('addStorage')}
                    </Link>
                  )}
                </div>

                {chosen.map(({ product }, index) => (
                  <div key={`${product.id}-${index}`} className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/catalog/${product.slug}`} className="line-clamp-2 text-sm hover:text-accent">
                        {productName(product, locale)}
                      </Link>
                      {product.stock < 1 && <p className="text-xs text-danger">{t('outOfStock')}</p>}
                    </div>
                    <span className="shrink-0 text-sm tabular-nums">{formatUzs(product.priceUzs, locale)}</span>
                    {slot !== 'storage' && (
                      <Link
                        href={builderHref(slugs, {}, { pick: slot })}
                        scroll={false}
                        className="text-sm text-muted hover:text-foreground"
                      >
                        {t('change')}
                      </Link>
                    )}
                    <Link
                      href={builderHref(slugs, {
                        [slot]: (slugs[slot] ?? []).filter((_, i) => i !== index),
                      })}
                      scroll={false}
                      aria-label={t('remove')}
                      className="text-muted hover:text-danger"
                    >
                      <X className="size-4" />
                    </Link>
                  </div>
                ))}

                {pick === slot && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted">
                      <span>{t('pickCount', { compatible: pickRows.filter((r) => r.errors.length === 0).length, total: pickRows.length, category: tCat(slot) })}</span>
                      <Link href={builderHref(slugs)} scroll={false} className="hover:text-foreground">
                        {t('close')}
                      </Link>
                    </div>
                    <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                      {pickRows.map(({ product, errors }) => (
                        <li key={product.id}>
                          <Link
                            href={builderHref(slugs, {
                              [slot]: slot === 'storage' ? [...(slugs.storage ?? []), product.slug] : [product.slug],
                            })}
                            scroll={false}
                            className={cn('flex items-center gap-3 py-2 text-sm hover:text-accent', errors.length > 0 && 'opacity-50')}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-1">{productName(product, locale)}</span>
                              {errors.length > 0 && <span className="block text-xs text-danger">{issueText(errors[0])}</span>}
                              {errors.length === 0 && product.stock < 1 && (
                                <span className="block text-xs text-muted">{t('outOfStock')}</span>
                              )}
                            </span>
                            <span className="shrink-0 tabular-nums">{formatUzs(product.priceUzs, locale)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {/* ── Итог: 3D, совместимость, цена ── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <BuildPreview parts={sceneParts} />

          <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
            {compat.errors.map((issue) => (
              <p key={issue.key} className="flex gap-2 text-danger">
                <XCircle className="mt-0.5 size-4 shrink-0" />
                {issueText(issue)}
              </p>
            ))}
            {compat.warnings.map((issue) => (
              <p key={issue.key} className="flex gap-2 text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {issueText(issue)}
              </p>
            ))}
            {items.length > 0 && compat.errors.length === 0 && compat.warnings.length === 0 && (
              <p className="flex gap-2 text-accent">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {t('compatOk')}
              </p>
            )}
            {items.length === 0 && <p className="text-muted">{t('emptyHint')}</p>}
            <p className="flex gap-2 text-muted">
              <Zap className="mt-0.5 size-4 shrink-0" />
              {t('power', { w: compat.powerEstimateW, psu: compat.recommendedPsuW })}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">{t('total')}</p>
            <Price amountUzs={totalUzs} locale={locale} large />
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={addBuildToCart.bind(null, slugs)}>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="rounded-lg bg-accent px-4 py-2 font-medium text-background hover:bg-accent-strong disabled:opacity-50"
                >
                  {t('addToCart')}
                </button>
              </form>
              <form action={saveBuild.bind(null, slugs)}>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-surface-2 disabled:opacity-50"
                >
                  {t('save')}
                </button>
              </form>
            </div>
            {compat.errors.length > 0 && <p className="mt-3 text-xs text-danger">{t('hasErrors')}</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}
