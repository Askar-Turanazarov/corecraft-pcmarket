import { getTranslations } from 'next-intl/server'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { catalogHref, type Query } from './query'

const stepClass = 'flex size-9 items-center justify-center rounded-lg border border-border hover:bg-surface'

export async function Pagination({
  query,
  page,
  pages,
}: {
  query: Query
  page: number
  pages: number
}) {
  const t = await getTranslations('catalog')
  if (pages <= 1) return null

  // Окно из пяти номеров вокруг текущей страницы.
  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const end = Math.min(pages, start + 4)
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav className="flex items-center justify-center gap-1.5 text-sm" aria-label={t('pagination')}>
      {page > 1 && (
        <Link
          href={catalogHref(query, { page: String(page - 1) })}
          aria-label={t('prev')}
          className={stepClass}
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}

      {numbers.map((n) => (
        <Link
          key={n}
          href={catalogHref(query, { page: n === 1 ? undefined : String(n) })}
          aria-current={n === page ? 'page' : undefined}
          className={cn(
            'flex size-9 items-center justify-center rounded-lg border',
            n === page ? 'border-accent text-accent' : 'border-border hover:bg-surface',
          )}
        >
          {n}
        </Link>
      ))}

      {page < pages && (
        <Link
          href={catalogHref(query, { page: String(page + 1) })}
          aria-label={t('next')}
          className={stepClass}
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  )
}
