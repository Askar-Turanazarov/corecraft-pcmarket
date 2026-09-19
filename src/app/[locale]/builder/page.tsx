import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AlertTriangle, CheckCircle2, ChevronUp, Plus, Search, X, XCircle, Zap } from 'lucide-react'
import { db } from '@/lib/db'
import { cn } from '@/lib/cn'
import { formatUzs } from '@/lib/money'
import { Link, getPathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { SLOTS, checkBuild, candidateErrors, type Issue, type Slot } from '@/lib/compat'
import { buildSummary, summaryLine } from '@/lib/build-summary'
import { rigFromParts } from '@/lib/fps'
import { CategoryIcon } from '@/components/shop/category-icon'
import { keySpecs } from '@/components/shop/key-specs'
import { Price } from '@/components/shop/price'
import { BuildPreview } from '@/components/builder/build-preview'
import { CopyButton } from '@/components/builder/copy-button'
import { FpsWidget } from '@/components/fps/fps-widget'
import { badge, button, card, field, pageTitle, panel } from '@/components/ui/styles'
import { MAX_STORAGE, builderHref, isSlot, loadBuild, readBuildSlugs, sceneParts, summaryLabels } from './build'
import { addBuildToCart, saveBuild } from './actions'


// Какие слоты задевает каждая ошибка совместимости — их карточки подсвечиваются.
const ISSUE_SLOTS: Record<string, Slot[]> = {
  socketMismatch: ['cpu', 'motherboard'],
  ramTypeMismatch: ['ram', 'motherboard'],
  ramTooManySticks: ['ram', 'motherboard'],
  caseFormFactor: ['case', 'motherboard'],
  gpuTooLong: ['gpu', 'case'],
  coolerTooTall: ['cooler', 'case'],
  coolerSocket: ['cooler', 'cpu'],
  radiatorUnsupported: ['cooler', 'case'],
  m2SlotsExceeded: ['storage', 'motherboard'],
  sataPortsExceeded: ['storage', 'motherboard'],
  psuTooWeak: ['psu'],
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params
  const [t, { items }] = await Promise.all([
    getTranslations({ locale, namespace: 'builder' }),
    searchParams.then((raw) => loadBuild(readBuildSlugs(raw))),
  ])
  // Когда сборкой делятся, превью ссылки показывает её конфигурацию.
  const line = summaryLine(buildSummary(items, await summaryLabels(locale)))
  return { title: t('title'), description: line || t('subtitle') }
}

export default async function BuilderPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)
  const [t, tc, tCat, tUnit] = await Promise.all([
    getTranslations('builder'),
    getTranslations('compat'),
    getTranslations('catalog.categories'),
    getTranslations('units'),
  ])
  const units = {
    gb: tUnit('gb'), mhz: tUnit('mhz'), ghz: tUnit('ghz'), w: tUnit('w'), mm: tUnit('mm'),
    cores: tUnit('cores'), tb: tUnit('tb'),
  }

  const raw = await searchParams
  const slugs = readBuildSlugs(raw)
  const pick = isSlot(raw.pick) ? raw.pick : undefined
  const pickQuery = typeof raw.pq === 'string' ? raw.pq.trim().slice(0, 60) : ''
  const saved = typeof raw.saved === 'string' ? raw.saved : undefined

  const { build, items } = await loadBuild(slugs)
  const compat = checkBuild(build)
  const totalUzs = items.reduce((sum, i) => sum + i.product.priceUzs, 0)
  const issueText = (issue: Issue) => tc(issue.key, issue.params)
  const badSlots = new Set(compat.errors.flatMap((e) => ISSUE_SLOTS[e.key] ?? []))

  const segments = buildSummary(items, await summaryLabels(locale))
  const line = summaryLine(segments)
  const filled = new Set(items.map((i) => i.slot)).size

  // Подборщик: сначала совместимые (дешевле выше), несовместимые ниже — с причиной.
  const pickRows = pick
    ? (
        await db.product.findMany({
          where: {
            kind: 'COMPONENT',
            category: pick,
            isActive: true,
            ...(pickQuery && { searchText: { contains: pickQuery.toLowerCase() } }),
          },
          orderBy: [{ priceUzs: 'asc' }, { id: 'asc' }],
        })
      )
        .map((product) => ({ product, errors: candidateErrors(build, pick, product) }))
        .sort((a, b) => Number(a.errors.length > 0) - Number(b.errors.length > 0))
    : []

  // Абсолютная ссылка для «поделиться» — с того же хоста, на котором открыт магазин.
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  // Для модели FPS; системный диск — первый выбранный накопитель.
  const productIn = (slot: Slot) => items.find((i) => i.slot === slot)?.product
  const rig = rigFromParts({ cpu: productIn('cpu'), gpu: productIn('gpu'), ram: productIn('ram'), drive: productIn('storage') })
  const fpsParams = new URLSearchParams()
  for (const slot of ['cpu', 'gpu', 'ram'] as const) {
    const slug = productIn(slot)?.slug
    if (slug) fpsParams.set(slot, slug)
  }

  const parts = sceneParts(items, locale as Locale)

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      {segments.map((s, i) => (
        <span
          key={`${s.slot}-${i}`}
          className="tabular inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2.5 py-1 text-sm"
        >
          <CategoryIcon category={s.slot} className="size-3.5 text-accent" />
          {s.text}
        </span>
      ))}
    </div>
  )
  const meta = (
    <span className="tabular text-sm text-muted">
      {t('summary.progress', { filled, total: SLOTS.length })} · {t('summary.watts', { w: compat.powerEstimateW })}
    </span>
  )
  const copyLabels = { copy: t('summary.copy'), copied: t('summary.copied') }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-10 md:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className={pageTitle}>{t('title')}</h1>
          <p className="max-w-2xl text-muted">{t('subtitle')}</p>
        </div>
        {items.length > 0 && (
          <Link href="/builder" className={button('ghost', 'sm')}>
            {t('reset')}
          </Link>
        )}
      </div>

      {/* ── Строка конфигурации: desktop — стеклянная полоса под шапкой ── */}
      <section
        aria-label={t('summary.title')}
        className="sticky top-16 z-30 mt-6 hidden rounded-[var(--radius-panel)] border border-border bg-glass p-4 shadow-[0_24px_60px_-40px_var(--glow)] backdrop-blur-xl md:block"
      >
        {segments.length === 0 ? (
          <p className="text-sm text-muted">{t('summary.empty')}</p>
        ) : (
          <div className="grid gap-3">
            {chips}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {meta}
              <div className="flex items-center gap-4">
                <span className="tabular font-display text-xl font-semibold">{formatUzs(totalUzs, locale)}</span>
                <CopyButton text={line} labels={copyLabels} />
              </div>
            </div>
          </div>
        )}
      </section>

      {saved && (
        <div className={cn(panel, 'mt-6 border-accent/40 p-4 text-sm')}>
          <p className="font-medium">{t('saved')}</p>
          <input
            readOnly
            aria-label={t('shareLink')}
            value={`${origin}/${locale}/builder/${saved}`}
            className={cn(field, 'mt-2 text-muted')}
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_27rem]">
        {/* ── Слоты ── */}
        <ol className="space-y-3">
          {SLOTS.map((slot) => {
            const chosen = items.filter((i) => i.slot === slot)
            const canAdd = slot === 'storage' ? chosen.length < MAX_STORAGE : chosen.length === 0
            const bad = badSlots.has(slot)
            return (
              <li
                key={slot}
                className={cn(
                  card,
                  'p-4 transition-colors',
                  chosen.length === 0 && 'border-dashed bg-transparent',
                  bad && 'border-danger/60',
                  pick === slot && 'border-accent/60',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] border',
                      chosen.length ? 'border-accent/40 text-accent' : 'border-border text-muted',
                    )}
                  >
                    <CategoryIcon category={slot} className="size-4.5" />
                  </span>
                  <h2 className="font-medium">{t(`slots.${slot}`)}</h2>
                  {bad && <span className={badge('danger')}>{t('conflict')}</span>}
                  {canAdd && (
                    <Link
                      href={builderHref(slugs, {}, { pick: slot })}
                      scroll={false}
                      className={cn(button(chosen.length ? 'ghost' : 'secondary', 'sm'), 'ml-auto')}
                    >
                      <Plus className="size-4" />
                      {chosen.length === 0 ? t('choose') : t('addStorage')}
                    </Link>
                  )}
                </div>

                {chosen.map(({ product }, index) => (
                  <div key={`${product.id}-${index}`} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
                    <div className="min-w-0 flex-1 basis-60">
                      <Link href={`/catalog/${product.slug}`} className="line-clamp-2 font-medium hover:text-accent">
                        {product.brand} {product.model}
                      </Link>
                      <p className="tabular mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                        {keySpecs(product, units).map((s) => (
                          <span key={s}>{s}</span>
                        ))}
                        {product.stock < 1 && <span className="text-danger">{t('outOfStock')}</span>}
                      </p>
                    </div>
                    <span className="tabular shrink-0 font-medium">{formatUzs(product.priceUzs, locale)}</span>
                    <div className="flex items-center gap-1">
                      {slot !== 'storage' && (
                        <Link href={builderHref(slugs, {}, { pick: slot })} scroll={false} className={button('ghost', 'sm')}>
                          {t('change')}
                        </Link>
                      )}
                      <Link
                        href={builderHref(slugs, { [slot]: (slugs[slot] ?? []).filter((_, i) => i !== index) })}
                        scroll={false}
                        aria-label={t('remove')}
                        className={cn(button('ghost', 'sm'), 'hover:text-danger')}
                      >
                        <X className="size-4" />
                      </Link>
                    </div>
                  </div>
                ))}

                {pick === slot && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Поиск внутри подборщика — GET-форма, текущая сборка едет скрытыми полями. */}
                      <form action={getPathname({ href: '/builder', locale })} className="relative min-w-48 flex-1">
                        {SLOTS.filter((s) => slugs[s]?.length).map((s) => (
                          <input key={s} type="hidden" name={s} value={slugs[s]!.join(',')} />
                        ))}
                        <input type="hidden" name="pick" value={slot} />
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                        <input
                          name="pq"
                          type="search"
                          defaultValue={pickQuery}
                          aria-label={t('pickSearch')}
                          placeholder={t('pickSearch')}
                          className={cn(field, 'min-h-10 pl-9 text-sm')}
                        />
                      </form>
                      <span className="text-xs text-muted">
                        {t('pickCount', {
                          compatible: pickRows.filter((r) => r.errors.length === 0).length,
                          total: pickRows.length,
                          category: tCat(slot),
                        })}
                      </span>
                      <Link href={builderHref(slugs)} scroll={false} className={button('ghost', 'sm')}>
                        {t('close')}
                      </Link>
                    </div>
                    <ul className="max-h-[28rem] space-y-1 overflow-y-auto pr-1">
                      {pickRows.map(({ product, errors }) => (
                        <li key={product.id}>
                          <Link
                            href={builderHref(slugs, {
                              [slot]: slot === 'storage' ? [...(slugs.storage ?? []), product.slug] : [product.slug],
                            })}
                            scroll={false}
                            className={cn(
                              'flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 transition-colors hover:bg-surface-2',
                              errors.length > 0 && 'opacity-60',
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-1 text-sm">{product.brand} {product.model}</span>
                              <span className="tabular mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                                {keySpecs(product, units).map((s) => (
                                  <span key={s}>{s}</span>
                                ))}
                              </span>
                              {errors.length > 0 && <span className="mt-0.5 block text-xs text-danger">{issueText(errors[0])}</span>}
                            </span>
                            {errors.length === 0 && (
                              <span className={badge(product.stock > 0 ? 'plasma' : 'neutral', 'max-sm:hidden')}>
                                {product.stock > 0 ? t('fits') : t('outOfStock')}
                              </span>
                            )}
                            <span className="tabular shrink-0 text-sm font-medium">{formatUzs(product.priceUzs, locale)}</span>
                          </Link>
                        </li>
                      ))}
                      {pickRows.length === 0 && <li className="px-3 py-6 text-sm text-muted">{t('pickEmpty')}</li>}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        {/* ── Итог: 3D, совместимость, FPS, покупка ── */}
        <aside className="space-y-4 lg:sticky lg:top-44 lg:self-start">
          <BuildPreview parts={parts} />

          <div className={cn(panel, 'space-y-2.5 p-5 text-sm')}>
            {compat.errors.map((issue) => (
              <p key={issue.key} className="flex gap-2 text-danger">
                <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {issueText(issue)}
              </p>
            ))}
            {compat.warnings.map((issue) => (
              <p key={issue.key} className="flex gap-2 text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {issueText(issue)}
              </p>
            ))}
            {items.length > 0 && compat.errors.length === 0 && compat.warnings.length === 0 && (
              <p className="flex gap-2 text-plasma">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t('compatOk')}
              </p>
            )}
            {items.length === 0 && <p className="text-muted">{t('emptyHint')}</p>}
            <p className="flex gap-2 text-muted">
              <Zap className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('power', { w: compat.powerEstimateW, psu: compat.recommendedPsuW })}
            </p>
          </div>

          <FpsWidget rig={rig} locale={locale} fpsHref={`/fps?${fpsParams}`} />

          <div className={cn(panel, 'p-5')}>
            <p className="text-sm text-muted">{t('total')}</p>
            <Price amountUzs={totalUzs} locale={locale} large />
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={addBuildToCart.bind(null, slugs)}>
                <button type="submit" disabled={items.length === 0} className={button('primary')}>
                  {t('addToCart')}
                </button>
              </form>
              <form action={saveBuild.bind(null, slugs)}>
                <button type="submit" disabled={items.length === 0} className={button('secondary')}>
                  {t('save')}
                </button>
              </form>
            </div>
            {compat.errors.length > 0 && <p className="mt-3 text-xs text-danger">{t('hasErrors')}</p>}
          </div>
        </aside>
      </div>

      {/* ── Строка конфигурации на телефоне: нижняя панель, раскрывается без JS ── */}
      <details className="group fixed inset-x-0 bottom-0 z-40 border-t border-border bg-glass backdrop-blur-xl md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="tabular block font-display text-lg font-semibold">{formatUzs(totalUzs, locale)}</span>
            {meta}
          </span>
          <span className={button('secondary', 'sm')}>
            {t('summary.title')}
            <ChevronUp className="size-4 transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </summary>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto px-4 pb-4">
          {segments.length === 0 ? <p className="text-sm text-muted">{t('summary.empty')}</p> : chips}
          {line && <CopyButton text={line} labels={copyLabels} />}
        </div>
      </details>
    </div>
  )
}
