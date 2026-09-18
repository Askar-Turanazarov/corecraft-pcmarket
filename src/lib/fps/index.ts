// Модель FPS: чистые функции, без БД и React.
// Это оценка по относительным индексам, а не замер — в интерфейсе так и пишем.
//
// gpuFps = K · gpuScore / (demand[preset] · resMult · rtMult · upscaleMult)
// cpuFps = C · cpuScore / cpuDemand          — от разрешения почти не зависит
// fps    = softMin(gpuFps, cpuFps) · ramPenalty · vramPenalty
//
// При K = C = 60 коэффициент игры demand — это gpuScore, нужный для 60 FPS
// в 1080p на этом пресете (RTX 4090 = 100); cpuDemand — то же для процессора.
import type { Game } from '@/generated/prisma/client'

export const PRESETS = ['low', 'medium', 'high', 'ultra'] as const
export const RESOLUTIONS = ['1080p', '1440p', '4k'] as const
export const UPSCALING = ['off', 'quality', 'balanced', 'performance'] as const
export type Preset = (typeof PRESETS)[number]
export type Resolution = (typeof RESOLUTIONS)[number]
export type Upscaling = (typeof UPSCALING)[number]

const RES_MULT: Record<Resolution, number> = { '1080p': 1, '1440p': 1.72, '4k': 3.35 }
// Во сколько раз легче видеокарте с DLSS/FSR: рендер в меньшем разрешении + цена апскейла.
const UPSCALE_MULT: Record<Upscaling, number> = { off: 1, quality: 0.72, balanced: 0.62, performance: 0.52 }
// Текстурам на высоком разрешении нужно больше видеопамяти.
const VRAM_RES_MULT: Record<Resolution, number> = { '1080p': 1, '1440p': 1.1, '4k': 1.25 }
// ponytail: трассировка у Radeon и Arc дороже, чем у GeForce, — один общий множитель
// вместо отдельного RT-индекса на каждую карту; завести rtScore, если понадобится точнее.
const RT_NON_NVIDIA = 1.3
const SOFTMIN_P = 3
const VRAM_PENALTY = 0.55

export type GameCoeffs = Pick<
  Game,
  | 'demandLow' | 'demandMedium' | 'demandHigh' | 'demandUltra' | 'cpuDemand'
  | 'vramLow' | 'vramMedium' | 'vramHigh' | 'vramUltra' | 'rtCost' | 'supportsRt' | 'supportsUpscaling'
>

export type Rig = {
  gpuScore: number | null
  gpuBrand?: string | null
  vramGb?: number | null
  cpuScore: number | null
  ramGb?: number | null
  ramSticks?: number | null
  ramMhz?: number | null
  ramType?: string | null
  systemDrive?: string | null // storageType первого накопителя
}

export type FpsSettings = { preset: Preset; resolution: Resolution; rt: boolean; upscaling: Upscaling }
export type FpsConstants = { K: number; C: number }
export type Bound = 'gpu' | 'cpu' | 'balanced'
export type Tier = 'excellent' | 'good' | 'playable' | 'poor'
export type FpsWarning = 'vramShort' | 'ramLow' | 'ramSingleChannel' | 'ramSlow' | 'hddSystem'

export type FpsEstimate = {
  avg: number
  low1: number
  gpuFps: number
  cpuFps: number
  bound: Bound
  tier: Tier
  warnings: FpsWarning[]
}

const cap = (s: string) => (s[0].toUpperCase() + s.slice(1)) as Capitalize<Preset>

/** Плавный минимум: у двух близких ограничений FPS ниже любого из них, как и в жизни. */
export function softMin(a: number, b: number, p = SOFTMIN_P): number {
  return (a ** -p + b ** -p) ** (-1 / p)
}

export function estimateFps(
  game: GameCoeffs,
  rig: Rig,
  settings: FpsSettings,
  constants: FpsConstants,
): FpsEstimate | null {
  if (!rig.gpuScore || !rig.cpuScore) return null

  const demand = game[`demand${cap(settings.preset)}`]
  const rt = settings.rt && game.supportsRt
  const rtMult = rt ? game.rtCost * (rig.gpuBrand && rig.gpuBrand !== 'NVIDIA' ? RT_NON_NVIDIA : 1) : 1
  const upscale = game.supportsUpscaling ? UPSCALE_MULT[settings.upscaling] : 1

  const gpuFps = (constants.K * rig.gpuScore) / (demand * RES_MULT[settings.resolution] * rtMult * upscale)
  const cpuFps = (constants.C * rig.cpuScore) / game.cpuDemand

  const warnings: FpsWarning[] = []
  let penalty = 1

  const vramNeed = game[`vram${cap(settings.preset)}`] * VRAM_RES_MULT[settings.resolution]
  if (rig.vramGb != null && rig.vramGb < vramNeed) {
    penalty *= VRAM_PENALTY
    warnings.push('vramShort')
  }
  if (rig.ramGb != null && rig.ramGb < 16) {
    penalty *= 0.85
    warnings.push('ramLow')
  }
  if (rig.ramSticks === 1) {
    penalty *= 0.9
    warnings.push('ramSingleChannel')
  }
  const slowMhz = rig.ramType === 'DDR4' ? 3200 : 5600
  if (rig.ramMhz != null && rig.ramMhz < slowMhz) {
    penalty *= 0.95
    warnings.push('ramSlow')
  }
  // HDD как системный диск — подгрузки и фризы, но средний FPS не трогаем: так честнее.
  if (rig.systemDrive === 'HDD') warnings.push('hddSystem')

  const avg = softMin(gpuFps, cpuFps) * penalty
  // 1% low: чем больше запас процессора над средним FPS, тем ровнее кадр.
  const reserve = cpuFps / avg
  const low1 = avg * Math.min(0.78, 0.6 + 0.08 * (reserve - 1))

  const ratio = gpuFps / cpuFps
  const bound: Bound = ratio < 0.8 ? 'gpu' : ratio > 1.25 ? 'cpu' : 'balanced'
  const tier: Tier = avg >= 100 ? 'excellent' : avg >= 60 ? 'good' : avg >= 30 ? 'playable' : 'poor'

  return { avg: Math.round(avg), low1: Math.round(low1), gpuFps: Math.round(gpuFps), cpuFps: Math.round(cpuFps), bound, tier, warnings }
}

type RigPart = {
  brand: string
  gpuScore: number | null
  cpuScore: number | null
  vramGb: number | null
  memoryGb: number | null
  memorySticks: number | null
  memoryMhz: number | null
  memoryType: string | null
  storageType: string | null
}

/** Конфигурация для модели из деталей каталога: процессор, видеокарта, память, системный диск. */
export function rigFromParts(parts: { cpu?: RigPart; gpu?: RigPart; ram?: RigPart; drive?: RigPart }): Rig {
  const { cpu, gpu, ram, drive } = parts
  return {
    gpuScore: gpu?.gpuScore ?? null,
    gpuBrand: gpu?.brand,
    vramGb: gpu?.vramGb,
    cpuScore: cpu?.cpuScore ?? null,
    ramGb: ram?.memoryGb,
    ramSticks: ram?.memorySticks,
    ramMhz: ram?.memoryMhz,
    ramType: ram?.memoryType,
    systemDrive: drive?.storageType,
  }
}
