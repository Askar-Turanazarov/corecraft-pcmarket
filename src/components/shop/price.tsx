import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/cn'
import { formatUzs, formatUsdApprox } from '@/lib/money'
import { getUsdRate } from '@/lib/settings'
import type { Locale } from '@/i18n/routing'

export async function Price({
  amountUzs,
  oldPriceUzs,
  locale,
  className,
  large,
}: {
  amountUzs: number
  oldPriceUzs?: number | null
  locale: Locale
  className?: string
  large?: boolean
}) {
  const [t, rate] = await Promise.all([getTranslations('common'), getUsdRate()])

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={cn('font-semibold', large ? 'text-2xl' : 'text-base')}>
          {formatUzs(amountUzs, locale)}
        </span>
        {oldPriceUzs != null && oldPriceUzs > amountUzs && (
          <s className="text-sm text-muted">{formatUzs(oldPriceUzs, locale)}</s>
        )}
      </div>
      <div className="text-xs text-muted">
        {t('approxUsd', { amount: formatUsdApprox(amountUzs, locale, rate) })}
      </div>
    </div>
  )
}
