import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AlertTriangle, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { getFpsConstants } from '@/lib/settings'
import { getPathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import {
  PRESETS, RESOLUTIONS, UPSCALING, estimateFps, rigFromParts,
  type FpsEstimate, type FpsSettings, type Preset, type Resolution, type Tier, type Upscaling,
} from '@/lib/fps'
import { FpsCell, TIER_CLASS, gameTitle } from '@/components/fps/fps-cell'
import { button, field, pageTitle, panel } from '@/components/ui/styles'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'fps' })
  return { title: t('title') }
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const pickOf = <T extends string>(list: readonly T[], v: string | undefined, fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback

// Популярная средняя сборка — чтобы страница сразу показывала цифры, а не пустую форму.
const DEFAULT_CPU = 'amd-ryzen-5-7600'
const DEFAULT_GPU = 'nvidia-geforce-rtx-4070-super-12gb'

export default async function FpsPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)
  const t = await getTranslations('fps')

  const raw = await searchParams
  const settings: FpsSettings = {
    resolution: pickOf<Resolution>(RESOLUTIONS, one(raw.res), '1440p'),
    preset: pickOf<Preset>(PRESETS, one(raw.preset), 'high'),
    upscaling: pickOf<Upscaling>(UPSCALING, one(raw.up), 'off'),
    rt: one(raw.rt) === '1',
  }
  const sel = {
    cpu: one(raw.cpu) ?? DEFAULT_CPU,
    gpu: one(raw.gpu) ?? DEFAULT_GPU,
    ram: one(raw.ram) ?? '',
    cpu2: one(raw.cpu2) ?? '',
    gpu2: one(raw.gpu2) ?? '',
  }

  const [parts, games, constants] = await Promise.all([
    db.product.findMany({
      where: { kind: 'COMPONENT', isActive: true, category: { in: ['cpu', 'gpu', 'ram'] } },
      orderBy: [{ priceUzs: 'desc' }, { id: 'asc' }],
    }),
    db.game.findMany({ where: { isActive: true }, orderBy: { titleEn: 'asc' } }),
    getFpsConstants(),
  ])
  const find = (category: string, slug: string) => parts.find((p) => p.category === category && p.slug === slug)

  const ram = find('ram', sel.ram)
  const rigA = rigFromParts({ cpu: find('cpu', sel.cpu), gpu: find('gpu', sel.gpu), ram })
  // Вторая конфигурация для сравнения: незаданная деталь берётся из первой.
  const compare = Boolean(sel.cpu2 || sel.gpu2)
  const rigB = rigFromParts({
    cpu: find('cpu', sel.cpu2) ?? find('cpu', sel.cpu),
    gpu: find('gpu', sel.gpu2) ?? find('gpu', sel.gpu),
    ram,
  })

  const rows = games.map((game) => ({
    game,
    a: estimateFps(game, rigA, settings, constants),
    b: compare ? estimateFps(game, rigB, settings, constants) : null,
  }))
  const avgOf = (key: 'a' | 'b') => {
    const list = rows.map((r) => r[key]).filter((e): e is FpsEstimate => e !== null)
    return list.length ? Math.round(list.reduce((s, e) => s + e.avg, 0) / list.length) : null
  }

  const options = (category: string, withEmpty?: string) => (
    <>
      {withEmpty !== undefined && <option value="">{withEmpty}</option>}
      {parts
        .filter((p) => p.category === category)
        .map((p) => (
          <option key={p.id} value={p.slug}>
            {p.brand} {p.model}
          </option>
        ))}
    </>
  )
  const selectClass = cn(field, 'text-sm')
  const labelClass = 'block space-y-1.5'
  const labelText = 'text-sm text-muted'
  const avgA = avgOf('a')
  const avgB = compare ? avgOf('b') : null
  const TIERS: Tier[] = ['excellent', 'good', 'playable', 'poor']

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className={pageTitle}>{t('title')}</h1>
      <p className="mt-3 flex max-w-3xl gap-2 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('disclaimer')}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[22rem_1fr]">
        {/* ── Настройки: обычная GET-форма, результат — в адресе страницы ── */}
        <form
          action={getPathname({ href: '/fps', locale })}
          className={cn(panel, 'h-fit space-y-6 p-5 lg:sticky lg:top-24')}
        >
          <fieldset className="space-y-4">
            <legend className="mb-3 font-medium">{t('rigTitle')}</legend>
            <label className={labelClass}>
              <span className={labelText}>{t('cpu')}</span>
              <select name="cpu" defaultValue={sel.cpu} className={selectClass}>{options('cpu')}</select>
            </label>
            <label className={labelClass}>
              <span className={labelText}>{t('gpu')}</span>
              <select name="gpu" defaultValue={sel.gpu} className={selectClass}>{options('gpu')}</select>
            </label>
            <label className={labelClass}>
              <span className={labelText}>{t('ram')}</span>
              <select name="ram" defaultValue={sel.ram} className={selectClass}>{options('ram', t('ramAny'))}</select>
            </label>
          </fieldset>

          <fieldset className="space-y-4 border-t border-border pt-5">
            <legend className="float-left mb-3 w-full font-medium">{t('settingsTitle')}</legend>
            <label className={labelClass}>
              <span className={labelText}>{t('resolution')}</span>
              <select name="res" defaultValue={settings.resolution} className={selectClass}>
                {RESOLUTIONS.map((r) => <option key={r} value={r}>{t(`res.${r}`)}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className={labelText}>{t('preset')}</span>
                <select name="preset" defaultValue={settings.preset} className={selectClass}>
                  {PRESETS.map((p) => <option key={p} value={p}>{t(`presets.${p}`)}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelText}>{t('upscaling')}</span>
                <select name="up" defaultValue={settings.upscaling} className={selectClass}>
                  {UPSCALING.map((u) => <option key={u} value={u}>{t(`up.${u}`)}</option>)}
                </select>
              </label>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" name="rt" value="1" defaultChecked={settings.rt} className="size-4 accent-[var(--accent)]" />
              {t('rt')}
            </label>
          </fieldset>

          <details className="group border-t border-border pt-5" open={compare}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-medium [&::-webkit-details-marker]:hidden">
              {t('compare')}
              <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-3 space-y-4">
              <label className={labelClass}>
                <span className={labelText}>{t('cpu2')}</span>
                <select name="cpu2" defaultValue={sel.cpu2} className={selectClass}>{options('cpu', t('same'))}</select>
              </label>
              <label className={labelClass}>
                <span className={labelText}>{t('gpu2')}</span>
                <select name="gpu2" defaultValue={sel.gpu2} className={selectClass}>{options('gpu', t('same'))}</select>
              </label>
            </div>
          </details>

          <button type="submit" className={button('primary', 'lg', 'w-full')}>
            {t('calculate')}
          </button>
        </form>

        {/* ── Результат ── */}
        <div className="min-w-0 space-y-4">
          <section aria-label={t('avgLabel')} className={cn(panel, 'glow flex flex-wrap items-end gap-x-10 gap-y-5 p-6')}>
            <div>
              <p className="text-sm text-muted">{compare ? t('configA') : t('avgLabel')}</p>
              <p className="tabular mt-1 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                {avgA ?? '—'}
                <span className="ml-2 font-sans text-base font-normal text-muted">FPS</span>
              </p>
            </div>
            {compare && (
              <div>
                <p className="text-sm text-muted">{t('configB')}</p>
                <p className="tabular mt-1 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                  {avgB ?? '—'}
                  {avgA !== null && avgB !== null && avgB !== avgA && (
                    <span className={cn('ml-3 font-sans text-base font-medium', avgB > avgA ? 'text-plasma' : 'text-danger')}>
                      {avgB > avgA ? `+${avgB - avgA}` : avgB - avgA}
                    </span>
                  )}
                </p>
              </div>
            )}
            {compare && <p className="basis-full text-sm text-muted">{t('avgLabel')}</p>}
            <ul className="flex basis-full flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-label={t('tiersTitle')}>
              {TIERS.map((tier) => (
                <li key={tier} className="flex items-center gap-1.5">
                  <span className={cn('size-2 rounded-full bg-current', TIER_CLASS[tier])} aria-hidden />
                  {t(`tiers.${tier}`)}
                </li>
              ))}
            </ul>
          </section>

          <div className={cn(panel, 'relative overflow-x-auto')}>
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="border-b border-border text-left text-muted">
                <tr>
                  <th className={cn('px-5 py-3 font-normal', compare && 'w-2/5')}>{t('game')}</th>
                  <th className={cn('px-5 py-3 font-normal', compare && 'w-[30%]')}>{compare ? t('configA') : t('fpsCol')}</th>
                  {compare && <th className="px-5 py-3 font-normal">{t('configB')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ game, a, b }) => (
                  <tr key={game.id} className="align-top">
                    <td className="px-5 py-3">
                      <span className="font-medium">{gameTitle(game, locale)}</span>
                      <span className="tabular mt-0.5 block text-xs text-muted">
                        {game.year}
                        {settings.rt && !game.supportsRt && ` · ${t('noRt')}`}
                      </span>
                    </td>
                    <td className="px-5 py-3"><FpsCell estimate={a} /></td>
                    {compare && (
                      <td className="px-5 py-3">
                        <FpsCell estimate={b} delta={a && b ? b.avg - a.avg : undefined} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.some((r) => r.a?.warnings.length) && (
            <p className="flex gap-2 text-xs text-warning">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {t('warningsHint')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
