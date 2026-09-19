import { getTranslations } from 'next-intl/server'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Locale } from '@/i18n/routing'
import type { FpsEstimate, Tier } from '@/lib/fps'

/** Цвет оценки: плазма — с запасом, обычный текст — комфортно, жёлтый — играбельно, красный — слабо. */
export const TIER_CLASS: Record<Tier, string> = {
  excellent: 'text-plasma',
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
  if (compact) return <span className={cn('tabular font-medium', TIER_CLASS[estimate.tier])}>{estimate.avg}</span>

  const warnings = estimate.warnings.map((w) => t(`warnings.${w}`)).join('. ')
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className={cn('tabular font-display text-xl font-semibold tracking-tight', TIER_CLASS[estimate.tier])}>
          {estimate.avg}
        </span>
        <span className="text-xs text-muted">FPS</span>
        {delta !== undefined && delta !== 0 && (
          <span className={cn('tabular text-xs font-medium', delta > 0 ? 'text-plasma' : 'text-danger')}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <div className="tabular flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
        <span>{t('low1', { fps: estimate.low1 })}</span>
        <span>{t(`bound.${estimate.bound}`)}</span>
        {warnings && (
          <span className="flex items-center gap-1 text-warning" title={warnings}>
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            <span className="sr-only md:not-sr-only">{warnings}</span>
          </span>
        )}
      </div>
    </div>
  )
}
