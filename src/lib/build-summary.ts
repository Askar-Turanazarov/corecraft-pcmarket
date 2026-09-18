import type { Slot } from './compat'

// Строка конфигурации сборки, как её пишут магазины:
// «Intel Core Ultra 9 285K, 5.7 ГГц | ОЗУ DDR5 128 ГБ 6400 МГц | 32 ГБ GeForce RTX 5090 | SSD M.2 Samsung 990 PRO 2TB»

// Сначала то, что покупатель сравнивает в первую очередь.
const ORDER: Slot[] = ['cpu', 'ram', 'gpu', 'storage', 'motherboard', 'cooler', 'psu', 'case']

export type SummaryPart = {
  brand: string
  model: string
  boostGhz: number | null
  memoryType: string | null
  memoryGb: number | null
  memoryMhz: number | null
  vramGb: number | null
  storageType: string | null
  wattage: number | null
}

export type SummaryLabels = { ghz: string; gb: string; mhz: string; w: string; ram: string; ssdM2: string; ssd: string; hdd: string }
export type SummarySegment = { slot: Slot; text: string }

const join = (...parts: Array<string | number | null | undefined | false>) => parts.filter(Boolean).join(' ')

function segment(slot: Slot, p: SummaryPart, l: SummaryLabels): string {
  switch (slot) {
    case 'cpu':
      return `${join(p.brand, p.model)}${p.boostGhz ? `, ${p.boostGhz} ${l.ghz}` : ''}`
    case 'ram':
      return join(l.ram, p.memoryType, p.memoryGb && `${p.memoryGb} ${l.gb}`, p.memoryMhz && `${p.memoryMhz} ${l.mhz}`)
    case 'gpu':
      // Объём видеопамяти выносим вперёд, из модели убираем дубль вида «32GB».
      return join(p.vramGb && `${p.vramGb} ${l.gb}`, p.model.replace(/\s*\d+\s*GB$/i, ''))
    case 'storage': {
      const kind = p.storageType === 'NVME' ? l.ssdM2 : p.storageType === 'HDD' ? l.hdd : l.ssd
      return join(kind, p.brand, p.model)
    }
    case 'psu':
      return join(p.wattage && `${p.wattage} ${l.w}`, p.brand, p.model)
    default:
      return join(p.brand, p.model)
  }
}

export function buildSummary(items: Array<{ slot: Slot; product: SummaryPart }>, labels: SummaryLabels): SummarySegment[] {
  return ORDER.flatMap((slot) =>
    items.filter((i) => i.slot === slot).map((i) => ({ slot, text: segment(slot, i.product, labels) })),
  )
}

export const summaryLine = (segments: SummarySegment[]) => segments.map((s) => s.text).join(' | ')
