'use server'

import { redirect as redirectExternal, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCart, writeCart } from '@/lib/cart'
import { TASHKENT_DISTRICTS } from '@/lib/districts'
import { checkPayable, markOrderPaid, orderNumber, readSnapshot, type SnapshotItem } from '@/lib/orders'
import { MAX_INVOICE_UZS, UZS_EXP, botApi, isMockPayments } from '@/lib/telegram/bot'

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  // +998 XX XXX-XX-XX в любом написании → +998XXXXXXXXX
  phone: z
    .string()
    .transform((s) => s.replace(/[\s()-]/g, ''))
    .pipe(z.string().regex(/^\+?998\d{9}$/))
    .transform((s) => (s.startsWith('+') ? s : `+${s}`)),
  district: z.enum(TASHKENT_DISTRICTS),
  address: z.string().trim().min(5).max(200),
  comment: z.string().trim().max(500).optional(),
})

export type CheckoutState = { fields?: string[]; error?: string } | null

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) redirect({ href: '/sign-in?next=/checkout', locale: await getLocale() })
  return session!.user
}

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await requireUser()
  const parsed = schema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { fields: parsed.error.issues.map((i) => String(i.path[0])) }

  // Цены и наличие — только из базы: корзина в cookie хранит лишь id и количество.
  const cart = await getCart()
  if (cart.items.length === 0) return { error: 'emptyCart' }
  if (cart.items.some(({ product, qty }) => !product.isActive || product.stock < qty)) return { error: 'outOfStock' }
  if (cart.totalUzs > MAX_INVOICE_UZS) return { error: 'tooLarge' }

  const locale = await getLocale()
  const tDistrict = await getTranslations('checkout.districts')
  const { name, phone, district, address, comment } = parsed.data
  const snapshot: SnapshotItem[] = cart.items.map(({ product, qty }) => ({
    productId: product.id,
    slug: product.slug,
    name: product.nameRu,
    priceUzs: product.priceUzs,
    qty,
  }))

  const order = await db.order.create({
    data: {
      userId: user.id,
      itemsSnapshot: JSON.stringify(snapshot),
      totalUzs: cart.totalUzs,
      customerName: name,
      phone,
      address: `${tDistrict(district)}, ${address}`,
      comment: comment || null,
    },
  })
  // Состав зафиксирован в заказе — корзину очищаем сразу; неоплаченный заказ можно оплатить из кабинета.
  await writeCart([])
  revalidatePath('/', 'layout')

  return startPayment(order.id, locale)
}

export async function payOrder(orderId: string) {
  const user = await requireUser()
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (order?.userId !== user.id) notFound()
  return startPayment(orderId, await getLocale())
}

async function startPayment(orderId: string, locale: string): Promise<never> {
  const reason = await checkPayable(orderId)
  if (reason) redirect({ href: `/account?error=${reason}`, locale })

  if (isMockPayments()) redirect({ href: `/checkout/pay/${orderId}`, locale })

  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } })
  const items = readSnapshot(order.itemsSnapshot)
  const link = await botApi<string>('createInvoiceLink', {
    title: `CoreCraft PC — №${orderNumber(order.id)}`,
    description: items.map((i) => `${i.name} ×${i.qty}`).join(', ').slice(0, 255),
    payload: order.id,
    provider_token: process.env.TELEGRAM_PROVIDER_TOKEN,
    currency: 'UZS',
    prices: [{ label: `№${orderNumber(order.id)}`, amount: order.totalUzs * UZS_EXP }],
  })
  redirectExternal(link)
}

/** Песочница: имитирует successful_payment тем же кодом, что и вебхук. */
export async function mockPay(orderId: string) {
  if (!isMockPayments()) notFound()
  const user = await requireUser()
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (order?.userId !== user.id) notFound()

  const locale = await getLocale()
  const reason = await checkPayable(orderId)
  if (reason) redirect({ href: `/account?error=${reason}`, locale })
  await markOrderPaid(orderId, `mock_${orderId}`)
  redirect({ href: `/account?paid=${orderId}`, locale })
}
