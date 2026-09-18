import { cache } from 'react'
import { db } from './db'
import { DEFAULT_USD_RATE } from './money'

/**
 * Курс доллара из админки. cache() схлопывает вызовы в пределах одного
 * запроса, поэтому каталог из 24 карточек читает настройку один раз.
 */
export const getUsdRate = cache(async (): Promise<number> => {
  const row = await db.setting.findUnique({ where: { key: 'usdRate' } })
  const rate = Number(row?.value)
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_RATE
})

/** Калибровочные константы модели FPS (K — видеокарта, C — процессор), правятся в админке. */
export const getFpsConstants = cache(async () => {
  const rows = await db.setting.findMany({ where: { key: { in: ['fpsGpuConstant', 'fpsCpuConstant'] } } })
  const read = (key: string) => {
    const value = Number(rows.find((r) => r.key === key)?.value)
    return Number.isFinite(value) && value > 0 ? value : 60
  }
  return { K: read('fpsGpuConstant'), C: read('fpsCpuConstant') }
})
