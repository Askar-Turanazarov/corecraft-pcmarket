import { getTranslations } from 'next-intl/server'
import { Gauge } from 'lucide-react'
import { db } from '@/lib/db'
import { getFpsConstants } from '@/lib/settings'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { panel } from '@/components/ui/styles'
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
  fpsHref?: string
}) {
  const t = await getTranslations('fps')
  const [games, constants] = await Promise.all([
    db.game.findMany({ where: { slug: { in: WIDGET_GAMES }, isActive: true } }),
    getFpsConstants(),
  ])
  const ready = rig.gpuScore && rig.cpuScore

  return (
    <div className={cn(panel, 'p-5 text-sm')}>
      <h2 className="flex items-center gap-2 font-medium">
        <Gauge className="size-4 text-accent" aria-hidden />
        {t('widgetTitle')}
      </h2>
      {!ready || games.length === 0 ? (
        <p className="mt-2 text-muted">{t('widgetHint')}</p>
      ) : (
        <div className="relative mt-3 overflow-x-auto">
        <table className="w-full">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="pb-1.5 font-normal">{t('game')}</th>
              {RESOLUTIONS.map((r) => (
                <th key={r} className="pb-1.5 pl-2 text-right font-normal">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {games.map((game) => (
              <tr key={game.id}>
                <td className="py-2 pr-2">{gameTitle(game, locale)}</td>
                {RESOLUTIONS.map((resolution) => {
                  const e = estimateFps(game, rig, { preset: 'high', resolution, rt: false, upscaling: 'off' }, constants)
                  return (
                    <td key={resolution} className="py-2 pl-2 text-right" title={e ? t('low1', { fps: e.low1 }) : undefined}>
                      <FpsCell estimate={e} compact />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted">{t('disclaimer')}</p>
      {fpsHref && (
        <Link href={fpsHref} className="mt-2 inline-flex min-h-11 items-center text-accent hover:underline">
          {t('widgetMore')}
        </Link>
      )}
    </div>
  )
}
