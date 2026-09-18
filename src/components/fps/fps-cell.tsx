import { getTranslations } from 'next-intl/server'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Locale } from '@/i18n/routing'
import type { FpsEstimate, Tier } from '@/lib/fps'

const TIER_CLASS: Record<Tier, string> = {
  excellent: 'text-accent',
  good: 'text-foreground',
  playable: 'text-warning',
  poor: 'text-danger',
}

export function gameTitle(game: { titleRu: string; titleUz: string; titleEn: string }, locale: Locale) {
  if (locale === 'uz') return game.titleUz
  if (locale === 'en') return game.titleEn
  return game.titleRu
}

/** Оценка FPS одной игры: средний, 1% low, упор и предупреждения. */
export async function FpsCell({
  estimate,
  delta,
  compact,
}: {
  estimate: FpsEstimate | null
  delta?: number
  compact?: boolean
}) {
  const t = await getTranslations('fps')
  if (!estimate) return <span className="text-muted">—</span>
  // В узкой таблице виджета — только число с цветом оценки.
  if (compact) return <span className={cn('font-medium', TIER_CLASS[estimate.tier])}>{estimate.avg}</span>

  const warnings = estimate.warnings.map((w) => t(`warnings.${w}`)).join('. ')
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <span className={cn('text-lg font-semibold tabular-nums', TIER_CLASS[estimate.tier])}>
        {estimate.avg} <span className="text-xs font-normal text-muted">FPS</span>
      </span>
      {delta !== undefined && delta !== 0 && (
        <span className={cn('text-xs tabular-nums', delta > 0 ? 'text-accent' : 'text-danger')}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
      <span className="text-xs text-muted">{t('low1', { fps: estimate.low1 })}</span>
      <span className="text-xs text-muted">{t(`bound.${estimate.bound}`)}</span>
      {warnings && (
        <span className="flex items-center gap-1 text-xs text-warning" title={warnings}>
          <AlertTriangle className="size-3.5" aria-hidden />
          <span className="sr-only md:not-sr-only">{warnings}</span>
        </span>
      )}
    </div>
  )
}
