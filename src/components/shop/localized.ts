import type { Locale } from '@/i18n/routing'

type Named = { nameRu: string; nameUz: string; nameEn: string }
type Described = { descRu: string | null; descUz: string | null; descEn: string | null }

export function productName(product: Named, locale: Locale): string {
  if (locale === 'uz') return product.nameUz
  if (locale === 'en') return product.nameEn
  return product.nameRu
}

export function productDesc(product: Described, locale: Locale): string | null {
  if (locale === 'uz') return product.descUz
  if (locale === 'en') return product.descEn
  return product.descRu
}
