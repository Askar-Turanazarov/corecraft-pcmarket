import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { formatUzs } from '@/lib/money'
import { card, sectionTitle } from '@/components/ui/styles'
import { ORDER_STATUSES, date, requireAdmin } from './admin'
import { Status, rowLink, table, tableWrap, title } from './admin-ui'

export default async function AdminDashboard({ params }: { params: Promise<{ adminPath: string }> }) {
  const { base } = await requireAdmin((await params).adminPath)

  const [products, lowStock, users, byStatus, lastOrders] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true, stock: { lte: 2 } } }),
    db.user.count(),
    db.order.groupBy({ by: ['status'], _count: { _all: true } }),
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])
  const statusCount = (s: string) => byStatus.find((r) => r.status === s)?._count._all ?? 0

  const tiles: [string, number, boolean][] = [
    ['Товаров', products, false],
    ['Мало на складе (≤ 2)', lowStock, lowStock > 0],
    ['Пользователей', users, false],
  ]

  return (
    <div className="space-y-8">
      <h1 className={title}>Дашборд</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map(([label, value, warn]) => (
          <div key={label} className={cn(card, 'p-5', warn && 'border-warning/40')}>
            <div className="text-sm text-muted">{label}</div>
            <div className={cn('tabular mt-2 font-display text-3xl font-semibold', warn && 'text-warning')}>{value}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className={cn(sectionTitle, 'mb-3')}>Заказы по статусам</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {ORDER_STATUSES.map((s) => (
            <li key={s}>
              <Link
                href={`${base}/orders?status=${s}`}
                className={cn(card, 'flex min-h-11 flex-col gap-2 p-4 transition-colors hover:border-accent/60')}
              >
                <Status value={s} />
                <span className="tabular font-display text-2xl font-semibold">{statusCount(s)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={cn(sectionTitle, 'mb-3')}>Последние заказы</h2>
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr><th>Дата</th><th>Клиент</th><th className="text-right!">Сумма</th><th>Статус</th></tr>
            </thead>
            <tbody>
              {lastOrders.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap"><Link href={`${base}/orders/${o.id}`} className={cn(rowLink, 'tabular')}>{date(o.createdAt)}</Link></td>
                  <td>{o.customerName}</td>
                  <td className="tabular whitespace-nowrap text-right">{formatUzs(o.totalUzs, 'ru')}</td>
                  <td><Status value={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
