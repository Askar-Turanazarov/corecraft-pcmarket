// Движок совместимости сборки: чистые функции, без БД и React —
// одинаково работает в подборщике на клиенте и при проверке на сервере.
import type { Product } from '@/generated/prisma/client'

export const SLOTS = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'cooler', 'psu', 'case'] as const
export type Slot = (typeof SLOTS)[number]

export type Part = Pick<
  Product,
  | 'id' | 'slug' | 'category' | 'socket' | 'formFactor' | 'memoryType' | 'memorySlots' | 'memorySticks'
  | 'memoryGb' | 'tdpW' | 'wattage' | 'lengthMm' | 'heightMm' | 'storageType' | 'coolerType' | 'coolerTdpW'
  | 'radiatorMm' | 'has12vhpwr' | 'm2Slots' | 'sataPorts' | 'supportsFormFactors' | 'supportsRadiators'
  | 'supportsSockets'
>

/** storage — несколько накопителей, остальные слоты — по одной детали */
export type Build = Partial<Record<Exclude<Slot, 'storage'>, Part>> & { storage?: Part[] }
export type Issue = { key: string; params?: Record<string, string | number> }
export type CompatResult = { errors: Issue[]; warnings: Issue[]; powerEstimateW: number; recommendedPsuW: number }

// Плата, память, вентиляторы — усреднённо.
// ponytail: константа вместо учёта каждой детали; точность ±30 Вт, для выбора БП хватает
const BASE_POWER_W = 60
const STORAGE_POWER_W: Record<string, number> = { NVME: 8, SATA_SSD: 5, HDD: 10 }
const PSU_HEADROOM = 1.3
const HIGH_POWER_GPU_W = 300
const MIN_RAM_GB = 16

// Битый JSON — «неизвестно»: правило пропускаем, а не роняем страницу.
function parseList(json: string | null): (string | number)[] | null {
  if (!json) return null
  try {
    const v: unknown = JSON.parse(json)
    return Array.isArray(v) ? v : null
  } catch {
    return null
  }
}

export function checkBuild(build: Build): CompatResult {
  const { cpu, motherboard: board, ram, gpu, cooler, psu } = build
  const pcCase = build.case
  const storage = build.storage ?? []
  const errors: Issue[] = []
  const warnings: Issue[] = []

  if (cpu?.socket && board?.socket && cpu.socket !== board.socket) {
    errors.push({ key: 'socketMismatch', params: { cpu: cpu.socket, board: board.socket } })
  }

  // Тип памяти сверяем только с платой: LGA1700 умеет DDR4 и DDR5, а в каталоге у CPU записан DDR5.
  if (ram?.memoryType && board?.memoryType && ram.memoryType !== board.memoryType) {
    errors.push({ key: 'ramTypeMismatch', params: { ram: ram.memoryType, board: board.memoryType } })
  }
  if (ram?.memorySticks != null && board?.memorySlots != null && ram.memorySticks > board.memorySlots) {
    errors.push({ key: 'ramTooManySticks', params: { sticks: ram.memorySticks, slots: board.memorySlots } })
  }

  if (board?.formFactor && pcCase) {
    const ff = parseList(pcCase.supportsFormFactors)
    if (ff && !ff.includes(board.formFactor)) {
      errors.push({ key: 'caseFormFactor', params: { board: board.formFactor, supported: ff.join(', ') } })
    }
  }

  if (gpu?.lengthMm != null && pcCase?.lengthMm != null && gpu.lengthMm > pcCase.lengthMm) {
    errors.push({ key: 'gpuTooLong', params: { gpu: gpu.lengthMm, max: pcCase.lengthMm } })
  }

  if (cooler) {
    if (cooler.coolerType === 'AIR' && cooler.heightMm != null && pcCase?.heightMm != null && cooler.heightMm > pcCase.heightMm) {
      errors.push({ key: 'coolerTooTall', params: { cooler: cooler.heightMm, max: pcCase.heightMm } })
    }
    const sockets = parseList(cooler.supportsSockets)
    if (cpu?.socket && sockets && !sockets.includes(cpu.socket)) {
      errors.push({ key: 'coolerSocket', params: { socket: cpu.socket } })
    }
    if (cooler.coolerType === 'AIO' && cooler.radiatorMm != null && pcCase) {
      // Числа из JSON могут прийти строками — сравниваем как числа.
      const rads = parseList(pcCase.supportsRadiators)
      if (rads && !rads.map(Number).includes(cooler.radiatorMm)) {
        errors.push({ key: 'radiatorUnsupported', params: { radiator: cooler.radiatorMm } })
      }
    }
    if (cooler.coolerTdpW != null && cpu?.tdpW != null && cooler.coolerTdpW < cpu.tdpW) {
      warnings.push({ key: 'coolerWeak', params: { cooler: cooler.coolerTdpW, cpu: cpu.tdpW } })
    }
  }

  if (board) {
    const nvme = storage.filter((s) => s.storageType === 'NVME').length
    const sata = storage.filter((s) => s.storageType === 'SATA_SSD' || s.storageType === 'HDD').length
    if (board.m2Slots != null && nvme > board.m2Slots) {
      errors.push({ key: 'm2SlotsExceeded', params: { count: nvme, slots: board.m2Slots } })
    }
    if (board.sataPorts != null && sata > board.sataPorts) {
      errors.push({ key: 'sataPortsExceeded', params: { count: sata, ports: board.sataPorts } })
    }
  }

  const powerEstimateW =
    (cpu?.tdpW ?? 0) +
    (gpu?.tdpW ?? 0) +
    BASE_POWER_W +
    storage.reduce((sum, s) => sum + (STORAGE_POWER_W[s.storageType ?? ''] ?? 0), 0)
  const recommendedPsuW = Math.ceil((powerEstimateW * PSU_HEADROOM) / 50) * 50

  if (psu?.wattage != null) {
    if (psu.wattage < powerEstimateW) {
      errors.push({ key: 'psuTooWeak', params: { psu: psu.wattage, need: powerEstimateW } })
    } else if (psu.wattage < recommendedPsuW) {
      warnings.push({ key: 'psuMarginal', params: { psu: psu.wattage, recommended: recommendedPsuW } })
    }
  }
  if (gpu?.tdpW != null && gpu.tdpW >= HIGH_POWER_GPU_W && psu?.has12vhpwr === false) {
    warnings.push({ key: 'psuNeeds12vhpwrAdapter', params: { gpu: gpu.tdpW } })
  }

  if (ram?.memorySticks === 1) warnings.push({ key: 'ramSingleChannel' })
  if (ram?.memoryGb != null && ram.memoryGb < MIN_RAM_GB) {
    warnings.push({ key: 'ramLowCapacity', params: { gb: ram.memoryGb, min: MIN_RAM_GB } })
  }

  return { errors, warnings, powerEstimateW, recommendedPsuW }
}

/** Ошибки, которые появятся, если поставить part в slot (для storage — добавить к списку). Для фильтрации списка в подборщике. */
export function candidateErrors(build: Build, slot: Slot, part: Part): Issue[] {
  // База — сборка без текущей детали слота, иначе замена «плохой на такую же плохую» выглядела бы безопасной.
  const base: Build = slot === 'storage' ? build : { ...build, [slot]: undefined }
  const next: Build =
    slot === 'storage' ? { ...build, storage: [...(build.storage ?? []), part] } : { ...build, [slot]: part }
  // Старые проблемы остальной сборки не должны отсеивать всех кандидатов подряд.
  // ponytail: сравниваем по key — если ошибка того же типа уже была, кандидат её не «добавляет»
  const before = new Set(checkBuild(base).errors.map((e) => e.key))
  return checkBuild(next).errors.filter((e) => !before.has(e.key))
}
