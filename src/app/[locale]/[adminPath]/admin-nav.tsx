'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

const NAV = [
  ['', 'Дашборд'],
  ['/products', 'Товары'],
  ['/games', 'Игры'],
  ['/orders', 'Заказы'],
  ['/users', 'Пользователи'],
  ['/settings', 'Настройки'],
] as const

// Клиентский только ради usePathname: layout не перерисовывается при навигации.
export function AdminNav({ base }: { base: string }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Разделы панели" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {NAV.map(([path, label]) => {
          const href = `${base}${path}`
          const active = path ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href
          return (
            <li key={path} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center whitespace-nowrap rounded-[var(--radius-control)] px-3 text-sm transition-colors',
                  active
                    ? 'bg-surface-2 font-medium text-foreground shadow-[inset_0_-2px_0_var(--accent)] lg:shadow-[inset_2px_0_0_var(--accent)]'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground',
                )}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
