'use server'

import { revalidatePath } from 'next/cache'
import { readCart, writeCart, mergeLine } from '@/lib/cart'
import { db } from '@/lib/db'

export async function addToCart(productId: string, qty = 1) {
  // Наличие проверяем на сервере: клиент мог прислать что угодно.
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true, isActive: true },
  })
  if (!product?.isActive || product.stock < 1) return

  const lines = await readCart()
  const current = lines.find((l) => l.productId === productId)?.qty ?? 0
  await writeCart(
    mergeLine(lines, productId, Math.min(current + qty, product.stock)),
  )
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
