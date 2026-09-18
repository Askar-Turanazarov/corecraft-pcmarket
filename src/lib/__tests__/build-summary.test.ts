import { describe, expect, it } from 'vitest'
import { buildSummary, summaryLine, type SummaryPart } from '../build-summary'

const labels = { ghz: 'GHz', gb: 'GB', mhz: 'MHz', w: 'W', ram: 'RAM', ssdM2: 'SSD M.2', ssd: 'SSD', hdd: 'HDD' }
const part = (p: Partial<SummaryPart>): SummaryPart => ({
  brand: '', model: '', boostGhz: null, memoryType: null, memoryGb: null, memoryMhz: null, vramGb: null, storageType: null, wattage: null, ...p,
})

describe('строка конфигурации', () => {
  it('собирается в порядке CPU → RAM → GPU → SSD, независимо от порядка выбора', () => {
    const line = summaryLine(
      buildSummary(
        [
          { slot: 'storage', product: part({ brand: 'Samsung', model: '990 PRO 2TB', storageType: 'NVME' }) },
          { slot: 'gpu', product: part({ brand: 'NVIDIA', model: 'GeForce RTX 5090 32GB', vramGb: 32 }) },
          { slot: 'cpu', product: part({ brand: 'Intel', model: 'Core Ultra 9 285K', boostGhz: 5.7 }) },
          { slot: 'ram', product: part({ memoryType: 'DDR5', memoryGb: 128, memoryMhz: 6400 }) },
        ],
        labels,
      ),
    )
    expect(line).toBe('Intel Core Ultra 9 285K, 5.7 GHz | RAM DDR5 128 GB 6400 MHz | 32 GB GeForce RTX 5090 | SSD M.2 Samsung 990 PRO 2TB')
  })

  it('пустая сборка — пустая строка, HDD и БП подписаны', () => {
    expect(summaryLine(buildSummary([], labels))).toBe('')
    const segs = buildSummary(
      [
        { slot: 'psu', product: part({ brand: 'Corsair', model: 'RM850x', wattage: 850 }) },
        { slot: 'storage', product: part({ brand: 'WD', model: 'Blue 2TB', storageType: 'HDD' }) },
      ],
      labels,
    )
    expect(segs.map((s) => s.text)).toEqual(['HDD WD Blue 2TB', '850 W Corsair RM850x'])
  })
})
