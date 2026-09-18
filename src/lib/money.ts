import type { Locale } from '@/i18n/routing'

/** Курс по умолчанию; фактический берётся из Setting.usdRate в админке. */
export const DEFAULT_USD_RATE = 11900

const SUM_SUFFIX: Record<Locale, string> = {
  ru: 'сум',
  uz: "so'm",
  en: 'UZS',
}

/** Цена в сумах. Суммы целые — деньги во float не храним и не считаем. */
export function formatUzs(amountUzs: number, locale: Locale): string {
  return `${new Intl.NumberFormat(locale).format(Math.round(amountUzs))} ${SUM_SUFFIX[locale]}`
}

/** Приблизительный эквивалент в долларах — печатается мелко рядом с ценой. */
export function formatUsdApprox(
  amountUzs: number,
  locale: Locale,
  rate: number = DEFAULT_USD_RATE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amountUzs / rate)
}
