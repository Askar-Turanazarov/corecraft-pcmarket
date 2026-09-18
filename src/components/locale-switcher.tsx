'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { cn } from '@/lib/cn'

const LABELS = { ru: 'RU', uz: 'UZ', en: 'EN' } as const

export function LocaleSwitcher() {
  const active = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          // usePathname из next-intl отдаёт путь уже без префикса локали
          onClick={() => router.replace(pathname, { locale })}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            locale === active
              ? 'bg-accent text-background'
              : 'text-muted hover:text-foreground',
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  )
}
