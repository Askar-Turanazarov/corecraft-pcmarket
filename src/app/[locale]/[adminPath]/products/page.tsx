import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { formatUzs } from '@/lib/money'
import { badge, button, field } from '@/components/ui/styles'
import { one, requireAdmin } from '../admin'
import { label, rowLink, table, tableWrap, title } from '../admin-ui'

const PER_PAGE = 50

export default async function AdminProducts({
  params,
  searchParams,
}: {
  params: Promise<{ adminPath: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { base } = await requireAdmin((await params).adminPath)
  const sp = await searchParams
  const q = one(sp.q)?.trim() ?? ''
  const category = one(sp.category) ?? ''
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1)

  const where = {
    ...(q && { OR: [{ nameRu: { contains: q } }, { slug: { contains: q } }, { model: { contains: q } }] }),
    ...(category && { category }),
  }
  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ category: 'asc' }, { nameRu: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.product.groupBy({ by: ['category'], orderBy: { category: 'asc' } }),
  ])
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const pageHref = (n: number) =>
    `${base}/products?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), page: String(n) })}`

  return (
    <div className="space-y-6">
      <h1 className={title}>
        Товары <span className="tabular text-base font-normal text-muted">({total})</span>
      </h1>

      {/* Обычная GET-форма: фильтр живёт в адресе, JS не нужен. */}
      <form className="flex flex-wrap items-end gap-3">
        <label className={cn(label, 'w-full sm:w-72')}>
          Поиск
          <input name="q" defaultValue={q} placeholder="Название, slug, модель" className={field} />
        </label>
        <label className={cn(label, 'w-full sm:w-56')}>
          Категория
          <select name="category" defaultValue={category} className={field}>
            <option value="">Все категории</option>
            {categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
          </select>
        </label>
        <button className={button('primary', 'md')}>Найти</button>
      </form>

      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr>
              <th>Название</th><th>Категория</th><th>Бренд</th>
              <th className="text-right!">Цена</th><th className="text-right!">Склад</th><th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={cn(!p.isActive && 'text-muted')}>
                <td className="min-w-56"><Link href={`${base}/products/${p.id}`} className={rowLink}>{p.nameRu}</Link></td>
                <td>{p.category}</td>
                <td>{p.brand}</td>
                <td className="tabular whitespace-nowrap text-right">{formatUzs(p.priceUzs, 'ru')}</td>
                <td className={cn('tabular text-right', p.stock <= 2 && 'font-medium text-warning')}>{p.stock}</td>
                <td>
                  <span className={badge(p.isActive ? 'plasma' : 'neutral')}>{p.isActive ? 'Активен' : 'Скрыт'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Страницы" className="flex items-center gap-2 text-sm">
        {page > 1 && (
          <Link href={pageHref(page - 1)} aria-label="Предыдущая страница" className={button('secondary', 'md', 'w-11 px-0')}>
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        )}
        <span className="tabular text-muted">Стр. {page} из {pages}</span>
        {page < pages && (
          <Link href={pageHref(page + 1)} aria-label="Следующая страница" className={button('secondary', 'md', 'w-11 px-0')}>
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </nav>
    </div>
  )
}
