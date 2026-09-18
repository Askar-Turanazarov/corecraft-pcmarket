import 'dotenv/config'
import { afterAll, describe, expect, it } from 'vitest'
import { db } from '../db'
import { checkPayable, markOrderPaid } from '../orders'

// Работает на локальной базе (npm run db:seed): создаёт заказ и убирает за собой.
describe('оплата заказа', async () => {
  const product = await db.product.findFirstOrThrow({ where: { stock: { gte: 2 }, isActive: true } })
  const order = await db.order.create({
    data: {
      itemsSnapshot: JSON.stringify([
        { productId: product.id, slug: product.slug, name: product.nameRu, priceUzs: product.priceUzs, qty: 2 },
      ]),
      totalUzs: product.priceUzs * 2,
      customerName: 'Test',
      phone: '+998901234567',
      address: 'Test',
    },
  })

  afterAll(async () => {
    await db.order.delete({ where: { id: order.id } })
    await db.product.update({ where: { id: product.id }, data: { stock: product.stock } })
  })

  it('перед оплатой сверяет сумму', async () => {
    expect(await checkPayable(order.id, order.totalUzs + 1)).toBe('priceChanged')
    expect(await checkPayable(order.id, order.totalUzs)).toBeNull()
  })

  it('повторная доставка successful_payment не списывает остаток дважды', async () => {
    expect(await markOrderPaid(order.id, `test_${order.id}`)).toBe(true)
    expect(await markOrderPaid(order.id, `test_${order.id}`)).toBe(false)
    expect(await markOrderPaid(order.id, `other_${order.id}`)).toBe(false)

    const after = await db.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(after.stock).toBe(product.stock - 2)
    const paid = await db.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(paid.status).toBe('PAID')
    expect(await checkPayable(order.id)).toBe('notPayable')
  })
})
