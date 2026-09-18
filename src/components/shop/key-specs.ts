// 2–3 главных параметра детали — то, по чему её сравнивают с соседями в списке.

type Specs = {
  category: string
  socket: string | null
  formFactor: string | null
  memoryType: string | null
  memoryGb: number | null
  memoryMhz: number | null
  coreCount: number | null
  boostGhz: number | null
  vramGb: number | null
  lengthMm: number | null
  heightMm: number | null
  storageGb: number | null
  storageType: string | null
  wattage: number | null
  coolerType: string | null
  coolerTdpW: number | null
  radiatorMm: number | null
  tdpW: number | null
}

export type UnitLabels = { gb: string; mhz: string; ghz: string; w: string; mm: string; cores: string; tb: string }

const size = (gb: number, u: UnitLabels) => (gb >= 1000 ? `${gb / 1000} ${u.tb}` : `${gb} ${u.gb}`)

export function keySpecs(p: Specs, u: UnitLabels): string[] {
  const list: unknown[] = (() => {
    switch (p.category) {
      case 'cpu':
        return [p.socket, p.coreCount && `${p.coreCount} ${u.cores}`, p.boostGhz && `${p.boostGhz} ${u.ghz}`]
      case 'gpu':
        return [p.vramGb && `${p.vramGb} ${u.gb}`, p.lengthMm && `${p.lengthMm} ${u.mm}`, p.tdpW && `${p.tdpW} ${u.w}`]
      case 'motherboard':
        return [p.socket, p.formFactor, p.memoryType]
      case 'ram':
        return [p.memoryType, p.memoryGb && `${p.memoryGb} ${u.gb}`, p.memoryMhz && `${p.memoryMhz} ${u.mhz}`]
      case 'storage':
        return [p.storageType === 'NVME' ? 'NVMe' : p.storageType === 'SATA_SSD' ? 'SATA SSD' : p.storageType, p.storageGb && size(p.storageGb, u)]
      case 'psu':
        return [p.wattage && `${p.wattage} ${u.w}`]
      case 'case':
        return [p.formFactor, p.lengthMm && `GPU ≤ ${p.lengthMm} ${u.mm}`, p.heightMm && `CPU ≤ ${p.heightMm} ${u.mm}`]
      case 'cooler':
        return [
          p.coolerType === 'AIO' ? `AIO ${p.radiatorMm ?? ''}`.trim() : p.heightMm && `${p.heightMm} ${u.mm}`,
          p.coolerTdpW && `${p.coolerTdpW} ${u.w}`,
        ]
      case 'prebuilt':
      case 'laptop':
        return [p.memoryGb && `${p.memoryGb} ${u.gb}`, p.vramGb && `GPU ${p.vramGb} ${u.gb}`, p.storageGb && size(p.storageGb, u)]
      default:
        return []
    }
  })()
  return list.filter((s): s is string => typeof s === 'string' && s !== '')
}
