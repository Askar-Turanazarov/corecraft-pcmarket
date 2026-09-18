import { db } from './db'
import { formatUzs } from './money'
import { notify } from './telegram/bot'

export type SnapshotItem = { productId: string; slug: string; name: string; priceUzs: number; qty: number }

export const orderNumber = (id: string) => id.slice(-6).toUpperCase()

export function readSnapshot(raw: string): SnapshotItem[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Можно ли оплачивать заказ прямо сейчас: он ждёт оплаты, товар есть на складе
 * и цены не поменялись с момента оформления. Возвращает причину отказа или null.
 */
export async function checkPayable(orderId: string, amountUzs?: number): Promise<string | null> {
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order || order.status !== 'PENDING') return 'notPayable'
  if (amountUzs !== undefined && amountUzs !== order.totalUzs) return 'priceChanged'

  const items = readSnapshot(order.itemsSnapshot)
  const products = await db.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } })
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product?.isActive || product.stock < item.qty) return 'outOfStock'
    if (product.priceUzs !== item.priceUzs) return 'priceChanged'
  }
  return null
}

/**
 * Отметить заказ оплаченным и списать остатки — ровно один раз.
 * Telegram повторяет доставку апдейтов, поэтому переход PENDING → PAID делаем
 * условным обновлением: второй вызов с тем же заказом ничего не найдёт и не спишет.
 * Уникальный telegramChargeId страхует от одной оплаты на два заказа.
 */
export async function markOrderPaid(orderId: string, chargeId: string): Promise<boolean> {
  const paid = await db.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING', telegramChargeId: null },
      data: { status: 'PAID', telegramChargeId: chargeId, paidAt: new Date() },
    })
    if (count === 0) return false

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } })
    // ponytail: остаток проверен в pre_checkout, но две оплаты подряд могут увести его в минус —
    // деньги уже списаны, отказать нельзя; такой заказ админ увидит по отрицательному остатку.
    for (const item of readSnapshot(order.itemsSnapshot)) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.qty } } })
    }
    return true
  })

  if (paid) {
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { user: true } })
    const text = `✅ Заказ №${orderNumber(order.id)} оплачен: ${formatUzs(order.totalUzs, 'ru')}\n${order.customerName}, ${order.phone}\n${order.address}`
    await notify(process.env.TELEGRAM_ADMIN_CHAT_ID, text)
    await notify(order.user?.telegramId, `✅ CoreCraft PC: заказ №${orderNumber(order.id)} оплачен. Мы свяжемся с вами для доставки.`)
  }
  return paid
}

