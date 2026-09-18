import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { formatUzs } from '@/lib/money'
import { ORDER_STATUSES, date, one, requireAdmin, ui } from '../admin'

export default async function AdminOrders({
  params,
  searchParams,
}: {
  params: Promise<{ adminPath: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { base } = await requireAdmin((await params).adminPath)
  const raw = one((await searchParams).status)
  const status = ORDER_STATUSES.find((s) => s === raw)

  // ponytail: без пагинации, последние 200 заказов. Потолок — когда в день их станут сотни.
  const orders = await db.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Заказы</h1>
      <div className="flex flex-wrap gap-1 text-sm">
        {[undefined, ...ORDER_STATUSES].map((s) => (
          <Link
            key={s ?? 'all'}
            href={s ? `${base}/orders?status=${s}` : `${base}/orders`}
            className={cn('rounded-md border px-3 py-1', s === status ? 'border-accent text-accent' : 'border-border hover:bg-surface')}
          >
            {s ?? 'Все'}
          </Link>
        ))}
      </div>
      <table className={ui.table}>
        <thead>
          <tr><th>Дата</th><th>Клиент</th><th>Телефон</th><th>Сумма</th><th>Статус</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><Link href={`${base}/orders/${o.id}`} className={ui.link}>{date(o.createdAt)}</Link></td>
              <td>{o.customerName}</td>
              <td className="whitespace-nowrap">{o.phone}</td>
              <td className="whitespace-nowrap">{formatUzs(o.totalUzs, 'ru')}</td>
              <td>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
