import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { requireAdmin } from './admin'

// ponytail: панель внутренняя, для сотрудников — i18n пропущен, строки по-русски.

// X-Robots-Tag для этих адресов дополнительно отдаёт next.config.ts (headers()).
export const metadata: Metadata = { robots: { index: false, follow: false } }

const NAV = [
  ['', 'Дашборд'],
  ['/products', 'Товары'],
  ['/games', 'Игры'],
  ['/orders', 'Заказы'],
  ['/users', 'Пользователи'],
  ['/settings', 'Настройки'],
] as const

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ adminPath: string }>
}) {
  const { base } = await requireAdmin((await params).adminPath)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-border pb-3 text-sm">
        {NAV.map(([path, label]) => (
          <Link key={path} href={`${base}${path}`} className="rounded-md px-3 py-1.5 hover:bg-surface">
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
