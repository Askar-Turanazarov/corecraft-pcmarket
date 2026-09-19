import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { formatUzs } from '@/lib/money'
import { setOrderStatus } from '../../actions'
import { cn } from '@/lib/cn'
import { button, card, field, panel } from '@/components/ui/styles'
import { ORDER_STATUSES, date, one, requireAdmin } from '../../admin'
import { ErrorNote, Status, label, table, tableWrap, title } from '../../admin-ui'

type SnapshotItem = { productId: string; slug: string; name: string; priceUzs: number; qty: number }

function readSnapshot(json: string): SnapshotItem[] {
  try {
    const items: unknown = JSON.parse(json)
    return Array.isArray(items) ? (items as SnapshotItem[]) : []
  } catch {
    return []
  }
}

export default async function AdminOrder({
  params,
  searchParams,
}: {
  params: Promise<{ adminPath: string; id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { adminPath, id } = await params
  await requireAdmin(adminPath)
  const error = one((await searchParams).error)

  const order = await db.order.findUnique({
    where: { id },
    include: { user: { select: { email: true, telegramId: true } } },
  })
  if (!order) notFound()
  const items = readSnapshot(order.itemsSnapshot)

  const info: [string, string][] = [
    ['Номер', order.id],
    ['Создан', date(order.createdAt)],
    ['Клиент', order.customerName],
    ['Телефон', order.phone],
    ['Аккаунт', order.user?.email ?? order.user?.telegramId ?? 'гость'],
    ['Адрес', order.address],
    ['Комментарий', order.comment ?? '—'],
    ['Оплачен', date(order.paidAt)],
    ['telegramChargeId', order.telegramChargeId ?? '—'],
  ]

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className={title}>Заказ от <span className="tabular">{date(order.createdAt)}</span></h1>
        <Status value={order.status} />
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}

      <dl className={cn(card, 'grid gap-x-6 gap-y-2 p-5 text-sm sm:grid-cols-[12rem_1fr]')}>
        {info.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="break-all max-sm:mb-2">{v}</dd>
          </div>
        ))}
      </dl>

      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr>
              <th>Товар</th><th className="text-right!">Цена</th><th className="text-right!">Кол-во</th><th className="text-right!">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.productId}>
                <td className="min-w-56">{i.name} <span className="text-muted">({i.slug})</span></td>
                <td className="tabular whitespace-nowrap text-right">{formatUzs(i.priceUzs, 'ru')}</td>
                <td className="tabular text-right">{i.qty}</td>
                <td className="tabular whitespace-nowrap text-right">{formatUzs(i.priceUzs * i.qty, 'ru')}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="text-right font-medium">Итого</td>
              <td className="tabular whitespace-nowrap text-right font-display font-semibold">{formatUzs(order.totalUzs, 'ru')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <form action={setOrderStatus} className={cn(panel, 'flex flex-wrap items-end gap-3 p-5 sm:p-6')}>
        <input type="hidden" name="id" value={order.id} />
        <label className={cn(label, 'w-full sm:w-56')}>
          Статус
          <select name="status" defaultValue={order.status} className={field}>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button className={button('primary', 'md')}>Сменить статус</button>
        <p className="basis-full text-xs text-muted">Склад и деньги при этом не меняются — возврат делается вручную.</p>
      </form>
    </div>
  )
}
