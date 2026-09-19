import { cache } from 'react'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Единственная проверка доступа к панели. Зовётся в layout, в КАЖДОЙ странице
 * и в каждом server action: layout не перерисовывается при клиентской навигации,
 * а action — публичный POST, так что одной проверки в layout мало.
 * Всегда 404, а не 403: чужой не должен узнать, что панель вообще есть.
 */
export const requireAdmin = cache(async (adminPath?: string) => {
  const secret = process.env.ADMIN_PATH
  if (!secret || (adminPath !== undefined && adminPath !== secret)) notFound()

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) notFound()

  // Роль берём из БД, а не из JWT: там она живёт до перелогина,
  // и снятый админ сохранил бы доступ, а назначенный — не получил бы.
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== 'ADMIN') notFound()

  return { userId, base: `/${secret}` }
})

export const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DONE', 'CANCELLED'] as const

// Колонки Product, которые читают движки совместимости и FPS. Списки общие
// для формы и для Zod-схемы в actions.ts — поле не потеряется в одном из мест.
export const PRODUCT_STR = ['socket', 'formFactor', 'chipset', 'memoryType', 'storageType', 'coolerType', 'pcieVersion'] as const
export const PRODUCT_INT = [
  'memorySlots', 'memoryGb', 'memoryMhz', 'memorySticks', 'tdpW', 'wattage', 'lengthMm', 'heightMm',
  'vramGb', 'coreCount', 'storageGb', 'coolerTdpW', 'radiatorMm', 'm2Slots', 'sataPorts',
] as const
export const PRODUCT_FLOAT = ['boostGhz', 'gpuScore', 'cpuScore'] as const
export const PRODUCT_JSON = ['supportsFormFactors', 'supportsRadiators', 'supportsSockets'] as const

export const GAME_NUMBERS = [
  'demandLow', 'demandMedium', 'demandHigh', 'demandUltra', 'cpuDemand',
  'vramLow', 'vramMedium', 'vramHigh', 'vramUltra', 'rtCost',
] as const

export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export const date = (d: Date | null) => (d ? d.toLocaleString('ru-RU') : '—')

