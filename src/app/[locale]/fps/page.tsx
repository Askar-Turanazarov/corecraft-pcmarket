import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AlertTriangle, Info } from 'lucide-react'
import { db } from '@/lib/db'
import { getFpsConstants } from '@/lib/settings'
import { getPathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import {
  PRESETS, RESOLUTIONS, UPSCALING, estimateFps, rigFromParts,
  type FpsEstimate, type FpsSettings, type Preset, type Resolution, type Upscaling,
} from '@/lib/fps'
import { FpsCell, gameTitle } from '@/components/fps/fps-cell'

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
  const selectClass = 'w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent'

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-2 flex gap-2 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0" />
        {t('disclaimer')}
      </p>

      <form action={getPathname({ href: '/fps', locale })} className="mt-8 grid gap-4 rounded-xl border border-border bg-surface p-4 text-sm md:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-muted">{t('cpu')}</span>
          <select name="cpu" defaultValue={sel.cpu} className={selectClass}>{options('cpu')}</select>
        </label>
        <label className="space-y-1.5">
          <span className="text-muted">{t('gpu')}</span>
          <select name="gpu" defaultValue={sel.gpu} className={selectClass}>{options('gpu')}</select>
        </label>
        <label className="space-y-1.5">
          <span className="text-muted">{t('ram')}</span>
          <select name="ram" defaultValue={sel.ram} className={selectClass}>{options('ram', t('ramAny'))}</select>
        </label>

        <label className="space-y-1.5">
          <span className="text-muted">{t('resolution')}</span>
          <select name="res" defaultValue={settings.resolution} className={selectClass}>
            {RESOLUTIONS.map((r) => <option key={r} value={r}>{t(`res.${r}`)}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-muted">{t('preset')}</span>
          <select name="preset" defaultValue={settings.preset} className={selectClass}>
            {PRESETS.map((p) => <option key={p} value={p}>{t(`presets.${p}`)}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-muted">{t('upscaling')}</span>
          <select name="up" defaultValue={settings.upscaling} className={selectClass}>
            {UPSCALING.map((u) => <option key={u} value={u}>{t(`up.${u}`)}</option>)}
          </select>
        </label>

        <details className="md:col-span-3" open={compare}>
          <summary className="cursor-pointer text-muted hover:text-foreground">{t('compare')}</summary>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-muted">{t('cpu2')}</span>
              <select name="cpu2" defaultValue={sel.cpu2} className={selectClass}>{options('cpu', t('same'))}</select>
            </label>
            <label className="space-y-1.5">
              <span className="text-muted">{t('gpu2')}</span>
              <select name="gpu2" defaultValue={sel.gpu2} className={selectClass}>{options('gpu', t('same'))}</select>
            </label>
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-4 md:col-span-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="rt" value="1" defaultChecked={settings.rt} className="size-4 accent-[var(--accent)]" />
            {t('rt')}
          </label>
          <button type="submit" className="ml-auto rounded-lg bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-strong">
            {t('calculate')}
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <p>{t('average', { fps: avgOf('a') ?? '—' })}</p>
        {compare && <p className="text-muted">{t('averageB', { fps: avgOf('b') ?? '—' })}</p>}
      </div>

      <div className="relative mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-normal">{t('game')}</th>
              <th className="px-4 py-2 font-normal">{compare ? t('configA') : t('fpsCol')}</th>
              {compare && <th className="px-4 py-2 font-normal">{t('configB')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ game, a, b }) => (
              <tr key={game.id}>
                <td className="px-4 py-2">
                  <span className="font-medium">{gameTitle(game, locale)}</span>
                  <span className="block text-xs text-muted">
                    {game.year}
                    {settings.rt && !game.supportsRt && ` · ${t('noRt')}`}
                  </span>
                </td>
                <td className="px-4 py-2"><FpsCell estimate={a} /></td>
                {compare && (
                  <td className="px-4 py-2">
                    <FpsCell estimate={b} delta={a && b ? b.avg - a.avg : undefined} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.some((r) => r.a?.warnings.length) && (
        <p className="mt-4 flex gap-2 text-xs text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          {t('warningsHint')}
        </p>
      )}
    </div>
  )
}
