import type { Metadata } from 'next'
import { requireAdmin } from './admin'
import { AdminNav } from './admin-nav'

// ponytail: панель внутренняя, для сотрудников — i18n пропущен, строки по-русски.

// X-Robots-Tag для этих адресов дополнительно отдаёт next.config.ts (headers()).
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ adminPath: string }>
}) {
  const { base } = await requireAdmin((await params).adminPath)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
      <aside className="mb-6 border-b border-border pb-3 lg:mb-0 lg:border-b-0 lg:pb-0">
        <div className="lg:sticky lg:top-24">
          <p className="mb-2 text-xs font-medium text-muted lg:px-3">Админ-панель</p>
          <AdminNav base={base} />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
