import { describe, expect, it } from 'vitest'
import { candidateErrors, checkBuild, type Build, type Part } from '.'

// Все поля null — в тесте задаём только то, что проверяем.
function part(fields: Partial<Part>): Part {
  return {
    id: 'x', slug: 'x', category: 'x',
    socket: null, formFactor: null, memoryType: null, memorySlots: null, memorySticks: null, memoryGb: null,
    tdpW: null, wattage: null, lengthMm: null, heightMm: null, storageType: null, coolerType: null,
    coolerTdpW: null, radiatorMm: null, has12vhpwr: null, m2Slots: null, sataPorts: null,
    supportsFormFactors: null, supportsRadiators: null, supportsSockets: null,
    ...fields,
  }
}

const cleanBuild = (): Build => ({
  cpu: part({ socket: 'AM5', tdpW: 120, memoryType: 'DDR5' }),
  motherboard: part({ socket: 'AM5', formFactor: 'ATX', memoryType: 'DDR5', memorySlots: 4, m2Slots: 2, sataPorts: 4 }),
  ram: part({ memoryType: 'DDR5', memorySticks: 2, memoryGb: 32 }),
  gpu: part({ tdpW: 285, lengthMm: 300 }),
  storage: [part({ storageType: 'NVME' })],
  cooler: part({ coolerType: 'AIR', coolerTdpW: 245, heightMm: 160, supportsSockets: '["AM5","LGA1700"]' }),
  psu: part({ wattage: 850, has12vhpwr: true }),
  case: part({ supportsFormFactors: '["ATX","MATX","ITX"]', lengthMm: 400, heightMm: 170, supportsRadiators: '[240,360]' }),
})

const keys = (issues: { key: string }[]) => issues.map((i) => i.key)

describe('checkBuild', () => {
  it('совместимая сборка — без ошибок и предупреждений', () => {
    const r = checkBuild(cleanBuild())
    expect(r.errors).toEqual([])
    expect(r.warnings).toEqual([])
    // 120 + 285 + 60 + 8 = 473; ×1.3 = 614.9 → 650
    expect(r.powerEstimateW).toBe(473)
    expect(r.recommendedPsuW).toBe(650)
  })

  it('разные сокеты процессора и платы', () => {
    const b = { ...cleanBuild(), cpu: part({ socket: 'LGA1700', tdpW: 125 }) }
    expect(checkBuild(b).errors).toContainEqual({ key: 'socketMismatch', params: { cpu: 'LGA1700', board: 'AM5' } })
  })

  it('тип памяти сверяется с платой, а не с процессором', () => {
    const b = cleanBuild()
    b.ram = part({ memoryType: 'DDR4', memorySticks: 2, memoryGb: 32 })
    expect(keys(checkBuild(b).errors)).toContain('ramTypeMismatch')

    // LGA1700 с DDR5 в каталоге + DDR4-плата + DDR4-память — это нормально.
    const intel: Build = {
      cpu: part({ socket: 'LGA1700', memoryType: 'DDR5' }),
      motherboard: part({ socket: 'LGA1700', memoryType: 'DDR4', memorySlots: 4 }),
      ram: part({ memoryType: 'DDR4', memorySticks: 2, memoryGb: 32 }),
    }
    expect(checkBuild(intel).errors).toEqual([])
  })

  it('видеокарта длиннее корпуса', () => {
    const b = { ...cleanBuild(), gpu: part({ tdpW: 285, lengthMm: 420 }) }
    expect(checkBuild(b).errors).toContainEqual({ key: 'gpuTooLong', params: { gpu: 420, max: 400 } })
  })

  it('башенный кулер выше корпуса', () => {
    const b = cleanBuild()
    b.cooler = part({ coolerType: 'AIR', coolerTdpW: 245, heightMm: 180, supportsSockets: '["AM5"]' })
    expect(keys(checkBuild(b).errors)).toContain('coolerTooTall')
  })

  it('слабый БП — ошибка, впритык — предупреждение', () => {
    const weak = { ...cleanBuild(), psu: part({ wattage: 450, has12vhpwr: true }) }
    expect(keys(checkBuild(weak).errors)).toContain('psuTooWeak')

    const marginal = { ...cleanBuild(), psu: part({ wattage: 550, has12vhpwr: true }) }
    const r = checkBuild(marginal)
    expect(r.errors).toEqual([])
    expect(r.warnings).toContainEqual({ key: 'psuMarginal', params: { psu: 550, recommended: 650 } })
  })

  it('NVMe больше, чем слотов M.2', () => {
    const b = { ...cleanBuild(), storage: [1, 2, 3].map(() => part({ storageType: 'NVME' })) }
    expect(checkBuild(b).errors).toContainEqual({ key: 'm2SlotsExceeded', params: { count: 3, slots: 2 } })
  })

  it('битый JSON в корпусе не роняет проверку', () => {
    const b = { ...cleanBuild(), case: part({ supportsFormFactors: 'ATX,', lengthMm: 400, heightMm: 170 }) }
    expect(checkBuild(b).errors).toEqual([])
  })

  it('candidateErrors отсеивает процессор с чужим сокетом', () => {
    const b = cleanBuild()
    expect(keys(candidateErrors(b, 'cpu', part({ socket: 'LGA1700', tdpW: 125 })))).toEqual(['socketMismatch'])
    expect(candidateErrors(b, 'cpu', part({ socket: 'AM5', tdpW: 170 }))).toEqual([])
  })
})
