import { Link } from '@/i18n/navigation'
import { db } from '@/lib/db'
import { formatUzs } from '@/lib/money'
import { ORDER_STATUSES, date, requireAdmin, ui } from './admin'

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

  const tiles: [string, number][] = [
    ['Товаров', products],
    ['Мало на складе (≤ 2)', lowStock],
    ['Пользователей', users],
    ...ORDER_STATUSES.map((s): [string, number] => [`Заказы ${s}`, statusCount(s)]),
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Дашборд</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className={ui.card}>
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-2 font-medium">Последние заказы</h2>
        <table className={ui.table}>
          <thead>
            <tr><th>Дата</th><th>Клиент</th><th>Сумма</th><th>Статус</th></tr>
          </thead>
          <tbody>
            {lastOrders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`${base}/orders/${o.id}`} className={ui.link}>{date(o.createdAt)}</Link></td>
                <td>{o.customerName}</td>
                <td>{formatUzs(o.totalUzs, 'ru')}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
