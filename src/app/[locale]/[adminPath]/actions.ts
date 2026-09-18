'use server'

import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/navigation'
import { db } from '@/lib/db'
import { searchTextOf } from '@/lib/search'
import { orderNumber } from '@/lib/orders'
import { notify } from '@/lib/telegram/bot'
import {
  GAME_NUMBERS, ORDER_STATUSES, PRODUCT_FLOAT, PRODUCT_INT, PRODUCT_JSON, PRODUCT_STR, requireAdmin,
} from './admin'

const STATUS_RU: Record<string, string> = {
  PENDING: 'ожидает оплаты', PAID: 'оплачен', SHIPPED: 'передан в доставку', DONE: 'доставлен', CANCELLED: 'отменён',
}

// Каждый action — публичный POST: права проверяем в начале каждого,
// id и значения из формы считаем недоверенными и прогоняем через Zod.

async function go(href: string, error?: string): Promise<never> {
  // ponytail: ошибку возвращаем через ?error=, введённые значения при этом теряются.
  // Потолок — формы с десятками полей; тогда перейти на useActionState.
  return redirect({ href: error ? `${href}?error=${encodeURIComponent(error)}` : href, locale: await getLocale() })
}

// ponytail: сбрасываем кэш всего сайта — правки в админке редкие, точечная инвалидация не окупится.
const refresh = () => revalidatePath('/', 'layout')

const blank = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)
const checkbox = z.preprocess((v) => v === 'on', z.boolean())
const optStr = z.preprocess(blank, z.string().trim().max(200).nullable())
const optInt = z.preprocess(blank, z.coerce.number().int().min(0).nullable())
const optFloat = z.preprocess(blank, z.coerce.number().min(0).nullable())
const id = z.string().min(1).max(64)

const isJson = (v: string, kind: 'array' | 'object') => {
  try {
    const parsed: unknown = JSON.parse(v)
    return kind === 'array' ? Array.isArray(parsed) : typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
  } catch {
    return false
  }
}
const optJsonArray = optStr.refine((v) => v === null || isJson(v, 'array'), 'нужен JSON-массив')

const fields = <K extends string, T>(keys: readonly K[], schema: T) =>
  Object.fromEntries(keys.map((k) => [k, schema])) as Record<K, T>

const productSchema = z.object({
  id,
  nameRu: z.string().trim().min(1).max(300),
  nameUz: z.string().trim().min(1).max(300),
  nameEn: z.string().trim().min(1).max(300),
  priceUzs: z.coerce.number().int().min(0),
  oldPriceUzs: optInt,
  stock: z.coerce.number().int().min(0),
  isActive: checkbox,
  has12vhpwr: z.enum(['', 'true', 'false']).transform((v) => (v === '' ? null : v === 'true')),
  specs: z.string().max(20000).refine((v) => isJson(v, 'object'), 'specs должен быть JSON-объектом'),
  ...fields(PRODUCT_STR, optStr),
  ...fields(PRODUCT_INT, optInt),
  ...fields(PRODUCT_FLOAT, optFloat),
  ...fields(PRODUCT_JSON, optJsonArray),
})

export async function saveProduct(formData: FormData) {
  const { base } = await requireAdmin()
  const parsed = productSchema.safeParse(Object.fromEntries(formData))
  const rawId = String(formData.get('id') ?? '')
  if (!parsed.success) return go(`${base}/products/${encodeURIComponent(rawId)}`, z.prettifyError(parsed.error))

  const { id: productId, ...data } = parsed.data
  // Названия могли поменяться — пересобираем строку поиска.
  const current = await db.product.findUniqueOrThrow({ where: { id: productId }, select: { brand: true, model: true } })
  await db.product.update({ where: { id: productId }, data: { ...data, searchText: searchTextOf({ ...current, ...data }) } })
  refresh()
  return go(`${base}/products`)
}

const gameSchema = z
  .object({
    slug: z.string().trim().regex(/^[a-z0-9-]{1,80}$/, 'slug: латиница, цифры и дефис'),
    titleRu: z.string().trim().min(1).max(200),
    titleUz: z.string().trim().min(1).max(200),
    titleEn: z.string().trim().min(1).max(200),
    year: z.coerce.number().int().min(1980).max(2100),
    engine: optStr,
    genre: optStr,
    // Только свой путь или https — никаких javascript: в src картинки.
    coverUrl: optStr.refine((v) => v === null || /^(\/|https:\/\/)/.test(v), 'coverUrl: /путь или https://'),
    supportsRt: checkbox,
    supportsUpscaling: checkbox,
    isActive: checkbox,
    ...fields(GAME_NUMBERS, z.coerce.number().positive()),
  })
  .refine((g) => g.demandLow < g.demandMedium && g.demandMedium < g.demandHigh && g.demandHigh < g.demandUltra, {
    message: 'нужно demandLow < demandMedium < demandHigh < demandUltra',
    path: ['demandLow'],
  })

export async function saveGame(formData: FormData) {
  const { base } = await requireAdmin()
  const gameId = String(formData.get('id') ?? '')
  const back = `${base}/games/${gameId ? encodeURIComponent(gameId) : 'new'}`
  const parsed = gameSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return go(back, z.prettifyError(parsed.error))

  try {
    if (gameId) await db.game.update({ where: { id: gameId }, data: parsed.data })
    else await db.game.create({ data: parsed.data })
  } catch (e) {
    // P2002 — занятый slug; остальное пусть падает как есть.
    if ((e as { code?: string }).code === 'P2002') return go(back, 'Такой slug уже есть')
    throw e
  }
  refresh()
  return go(`${base}/games`)
}

export async function setOrderStatus(formData: FormData) {
  const { base } = await requireAdmin()
  const parsed = z.object({ id, status: z.enum(ORDER_STATUSES) }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return go(`${base}/orders`, z.prettifyError(parsed.error))

  // ponytail: смена статуса не возвращает товар на склад и не делает возврат денег —
  // это руками. Потолок — когда отмен станет много, нужен отдельный сценарий отмены.
  const order = await db.order.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
    include: { user: { select: { telegramId: true } } },
  })
  // Покупатель, вошедший через Telegram, узнаёт о смене статуса от бота.
  await notify(order.user?.telegramId, `CoreCraft PC: заказ №${orderNumber(order.id)} — ${STATUS_RU[order.status]}`)
  refresh()
  return go(`${base}/orders/${encodeURIComponent(parsed.data.id)}`)
}

export async function toggleRole(formData: FormData) {
  const { base, userId } = await requireAdmin()
  const parsed = z.object({ id }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return go(`${base}/users`, z.prettifyError(parsed.error))
  // Иначе последний админ может запереть панель сам от себя.
  if (parsed.data.id === userId) return go(`${base}/users`, 'Нельзя менять роль самому себе')

  const user = await db.user.findUnique({ where: { id: parsed.data.id }, select: { role: true } })
  if (!user) return go(`${base}/users`, 'Пользователь не найден')
  await db.user.update({
    where: { id: parsed.data.id },
    data: { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' },
  })
  refresh()
  return go(`${base}/users`)
}

const settingsSchema = z.object({
  usdRate: z.coerce.number().positive(),
  fpsGpuConstant: z.coerce.number().positive(),
  fpsCpuConstant: z.coerce.number().positive(),
})

export async function saveSettings(formData: FormData) {
  const { base } = await requireAdmin()
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return go(`${base}/settings`, z.prettifyError(parsed.error))

  await db.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      db.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } }),
    ),
  )
  refresh()
  return go(`${base}/settings`)
}
