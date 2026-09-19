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
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span
          className={cn(
            'tabular font-display font-semibold tracking-tight',
            large ? 'text-2xl sm:text-3xl' : 'text-[15px]',
          )}
        >
          {formatUzs(amountUzs, locale)}
        </span>
        {oldPriceUzs != null && oldPriceUzs > amountUzs && (
          <s className="tabular text-sm text-muted">{formatUzs(oldPriceUzs, locale)}</s>
        )}
      </div>
      <div className={cn('tabular text-muted', large ? 'mt-1 text-sm' : 'text-xs')}>
        {t('approxUsd', { amount: formatUsdApprox(amountUzs, locale, rate) })}
      </div>
    </div>
  )
}
