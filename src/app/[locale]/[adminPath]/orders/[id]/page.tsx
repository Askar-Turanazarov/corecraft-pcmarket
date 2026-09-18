import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { formatUzs } from '@/lib/money'
import { setOrderStatus } from '../../actions'
import { ORDER_STATUSES, date, one, requireAdmin, ui } from '../../admin'

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Заказ от {date(order.createdAt)}</h1>
      {error && <p className="whitespace-pre-line rounded-md border border-danger px-3 py-2 text-sm text-danger">{error}</p>}

      <dl className={`${ui.card} grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]`}>
        {info.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="break-all">{v}</dd>
          </div>
        ))}
      </dl>

      <table className={ui.table}>
        <thead>
          <tr><th>Товар</th><th>Цена</th><th>Кол-во</th><th>Сумма</th></tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.productId}>
              <td>{i.name} <span className="text-muted">({i.slug})</span></td>
              <td>{formatUzs(i.priceUzs, 'ru')}</td>
              <td>{i.qty}</td>
              <td>{formatUzs(i.priceUzs * i.qty, 'ru')}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} className="text-right font-medium">Итого</td>
            <td className="font-medium">{formatUzs(order.totalUzs, 'ru')}</td>
          </tr>
        </tbody>
      </table>

      <form action={setOrderStatus} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={order.id} />
        <select name="status" defaultValue={order.status} className={`${ui.input} max-w-48`}>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className={ui.button}>Сменить статус</button>
        <span className="text-xs text-muted">Склад и деньги при этом не меняются — возврат делается вручную.</span>
      </form>
    </div>
  )
}
