import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { formatUzs } from '@/lib/money'
import { one, requireAdmin, ui } from '../admin'

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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Товары <span className="text-base text-muted">({total})</span></h1>

      {/* Обычная GET-форма: фильтр живёт в адресе, JS не нужен. */}
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Название, slug, модель" className={cn(ui.input, 'max-w-xs')} />
        <select name="category" defaultValue={category} className={cn(ui.input, 'max-w-48')}>
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
        </select>
        <button className={ui.button}>Найти</button>
      </form>

      <table className={ui.table}>
        <thead>
          <tr><th>Название</th><th>Категория</th><th>Бренд</th><th>Цена</th><th>Склад</th><th>Активен</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={cn(!p.isActive && 'text-muted')}>
              <td><Link href={`${base}/products/${p.id}`} className={ui.link}>{p.nameRu}</Link></td>
              <td>{p.category}</td>
              <td>{p.brand}</td>
              <td className="whitespace-nowrap">{formatUzs(p.priceUzs, 'ru')}</td>
              <td className={cn(p.stock <= 2 && 'text-warning')}>{p.stock}</td>
              <td>{p.isActive ? 'да' : 'нет'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3 text-sm">
        {page > 1 && <Link href={pageHref(page - 1)} className={ui.link}>← Назад</Link>}
        <span className="text-muted">Стр. {page} из {pages}</span>
        {page < pages && <Link href={pageHref(page + 1)} className={ui.link}>Вперёд →</Link>}
      </div>
    </div>
  )
}
