import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import { formatUzs } from '@/lib/money'
import { ORDER_STATUSES, date, one, requireAdmin } from '../admin'
import { Status, rowLink, table, tableWrap, title } from '../admin-ui'

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
    <div className="space-y-6">
      <h1 className={title}>Заказы</h1>
      <nav aria-label="Фильтр по статусу" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-2">
          {[undefined, ...ORDER_STATUSES].map((s) => (
            <li key={s ?? 'all'} className="shrink-0">
              <Link
                href={s ? `${base}/orders?status=${s}` : `${base}/orders`}
                aria-current={s === status ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-[var(--radius-control)] border px-4 text-sm transition-colors',
                  s === status
                    ? 'border-accent bg-accent/10 font-medium text-accent'
                    : 'border-border text-muted hover:border-accent/60 hover:text-foreground',
                )}
              >
                {s ?? 'Все'}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr><th>Дата</th><th>Клиент</th><th>Телефон</th><th className="text-right!">Сумма</th><th>Статус</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap"><Link href={`${base}/orders/${o.id}`} className={cn(rowLink, 'tabular')}>{date(o.createdAt)}</Link></td>
                <td>{o.customerName}</td>
                <td className="tabular whitespace-nowrap">{o.phone}</td>
                <td className="tabular whitespace-nowrap text-right">{formatUzs(o.totalUzs, 'ru')}</td>
                <td><Status value={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="border-t border-border p-6 text-sm text-muted">Заказов нет.</p>}
      </div>
    </div>
  )
}
