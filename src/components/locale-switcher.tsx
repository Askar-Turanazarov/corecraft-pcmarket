'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { cn } from '@/lib/cn'

const LABELS = { ru: 'RU', uz: 'UZ', en: 'EN' } as const

export function LocaleSwitcher() {
  const active = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  return (
    <div className="flex items-center rounded-[var(--radius-control)] border border-border p-0.5">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-current={locale === active ? 'true' : undefined}
          // Параметры адреса сохраняем: иначе смена языка сбрасывает сборку в конструкторе и фильтры каталога.
          onClick={() => router.replace(`${pathname}${search.size ? `?${search}` : ''}`, { locale })}
          className={cn(
            'min-h-8 cursor-pointer rounded-[6px] px-2 text-xs font-semibold transition-colors',
            locale === active ? 'bg-accent text-on-accent' : 'text-muted hover:text-foreground',
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  )
}
