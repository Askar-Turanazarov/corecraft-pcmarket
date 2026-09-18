import { getTranslations } from 'next-intl/server'
import { Gauge } from 'lucide-react'
import { db } from '@/lib/db'
import { getFpsConstants } from '@/lib/settings'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { RESOLUTIONS, estimateFps, type Rig } from '@/lib/fps'
import { FpsCell, gameTitle } from './fps-cell'

// Самые популярные игры из базы — полный список на странице калькулятора.
const WIDGET_GAMES = ['cyberpunk-2077', 'counter-strike-2', 'elden-ring', 'black-myth-wukong', 'fortnite', 'red-dead-redemption-2']

/** FPS сборки в конструкторе: несколько игр, высокие настройки, три разрешения. */
export async function FpsWidget({
  rig,
  locale,
  fpsHref,
}: {
  rig: Rig
  locale: Locale
  fpsHref: string
}) {
  const t = await getTranslations('fps')
  const [games, constants] = await Promise.all([
    db.game.findMany({ where: { slug: { in: WIDGET_GAMES }, isActive: true } }),
    getFpsConstants(),
  ])
  const ready = rig.gpuScore && rig.cpuScore

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm">
      <h2 className="flex items-center gap-2 font-medium">
        <Gauge className="size-4 text-accent" />
        {t('widgetTitle')}
      </h2>
      {!ready || games.length === 0 ? (
        <p className="mt-2 text-muted">{t('widgetHint')}</p>
      ) : (
        <table className="mt-3 w-full">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="pb-1 font-normal">{t('game')}</th>
              {RESOLUTIONS.map((r) => (
                <th key={r} className="pb-1 font-normal">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {games.map((game) => (
              <tr key={game.id}>
                <td className="py-1.5 pr-2">{gameTitle(game, locale)}</td>
                {RESOLUTIONS.map((resolution) => {
                  const e = estimateFps(game, rig, { preset: 'high', resolution, rt: false, upscaling: 'off' }, constants)
                  return (
                    <td key={resolution} className="py-1.5 tabular-nums" title={e ? t('low1', { fps: e.low1 }) : undefined}>
                      <FpsCell estimate={e} compact />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-xs text-muted">{t('disclaimer')}</p>
      <Link href={fpsHref} className="mt-2 inline-block text-accent hover:underline">
        {t('widgetMore')}
      </Link>
    </div>
  )
}
