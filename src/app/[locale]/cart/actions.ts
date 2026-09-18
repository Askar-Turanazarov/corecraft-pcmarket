'use server'

import { revalidatePath } from 'next/cache'
import { readCart, writeCart, mergeLine } from '@/lib/cart'
import { db } from '@/lib/db'

export async function addToCart(productId: string) {
  await addManyToCart([productId])
}

/** По одной штуке каждого id; повтор id — ещё одна штука (два одинаковых SSD в сборке). */
export async function addManyToCart(productIds: string[]) {
  // Наличие проверяем на сервере: клиент мог прислать что угодно.
  const products = await db.product.findMany({
    where: { id: { in: productIds }, isActive: true, stock: { gt: 0 } },
    select: { id: true, stock: true },
  })

  let lines = await readCart()
  for (const id of productIds) {
    const product = products.find((p) => p.id === id)
    if (!product) continue
    const current = lines.find((l) => l.productId === id)?.qty ?? 0
    lines = mergeLine(lines, id, Math.min(current + 1, product.stock))
  }
  await writeCart(lines)
  revalidatePath('/', 'layout')
}

export async function setCartQty(productId: string, qty: number) {
  // Как и при добавлении: больше, чем есть на складе, в корзину не кладём.
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  })
  const safe = Number.isFinite(qty) ? Math.min(qty, product?.stock ?? 0) : 0
  await writeCart(mergeLine(await readCart(), productId, safe))
  revalidatePath('/', 'layout')
}

export async function removeFromCart(productId: string) {
  await writeCart(mergeLine(await readCart(), productId, 0))
  revalidatePath('/', 'layout')
}
