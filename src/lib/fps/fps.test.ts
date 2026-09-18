import { describe, expect, it } from 'vitest'
import { PRESETS, RESOLUTIONS, estimateFps, softMin, type FpsSettings, type GameCoeffs, type Rig } from '.'

const K = { K: 60, C: 60 }
// Тяжёлая игра уровня Cyberpunk 2077: RTX 4090 ≈ 150 FPS в 1080p Ultra.
const game: GameCoeffs = {
  demandLow: 18, demandMedium: 25, demandHigh: 32, demandUltra: 40, cpuDemand: 30,
  vramLow: 5, vramMedium: 6.5, vramHigh: 8, vramUltra: 9.5,
  rtCost: 2.2, supportsRt: true, supportsUpscaling: true,
}
const top: Rig = { gpuScore: 100, gpuBrand: 'NVIDIA', vramGb: 24, cpuScore: 100, ramGb: 32, ramSticks: 2, ramMhz: 6000, ramType: 'DDR5' }
const base: FpsSettings = { preset: 'ultra', resolution: '1080p', rt: false, upscaling: 'off' }
const fps = (rig: Rig, s: Partial<FpsSettings> = {}) => estimateFps(game, rig, { ...base, ...s }, K)!

describe('модель FPS', () => {
  it('softMin ниже меньшего из двух и ≈ ему при большом разрыве', () => {
    expect(softMin(100, 100)).toBeLessThan(100)
    expect(softMin(60, 600)).toBeGreaterThan(59)
  })

  it('калибровка: 4090 + 9800X3D ≈ 140 FPS в 1080p Ultra', () => {
    expect(fps(top).avg).toBeGreaterThan(125)
    expect(fps(top).avg).toBeLessThan(150)
  })

  it('FPS падает с ростом пресета и разрешения', () => {
    for (const resolution of RESOLUTIONS) {
      const values = PRESETS.map((preset) => fps(top, { preset, resolution }).avg)
      expect([...values].sort((a, b) => b - a)).toEqual(values)
    }
    const byRes = RESOLUTIONS.map((resolution) => fps(top, { resolution }).avg)
    expect([...byRes].sort((a, b) => b - a)).toEqual(byRes)
  })

  it('упор: слабый процессор с топовой картой — CPU, слабая карта — GPU', () => {
    expect(fps({ ...top, cpuScore: 46 }, { preset: 'low' }).bound).toBe('cpu')
    expect(fps({ ...top, gpuScore: 26, vramGb: 12 }, { resolution: '4k' }).bound).toBe('gpu')
  })

  it('нехватка видеопамяти даёт штраф и предупреждение', () => {
    const enough = fps({ ...top, gpuScore: 40, vramGb: 16 })
    const short = fps({ ...top, gpuScore: 40, vramGb: 8 })
    expect(short.warnings).toContain('vramShort')
    expect(short.avg).toBeLessThan(enough.avg * 0.6)
  })

  it('апскейлинг ускоряет только видеокарту', () => {
    const off = fps(top, { resolution: '4k' })
    const on = fps(top, { resolution: '4k', upscaling: 'performance' })
    expect(on.gpuFps).toBeGreaterThan(off.gpuFps)
    expect(on.cpuFps).toBe(off.cpuFps)
  })

  it('HDD системным диском — предупреждение без изменения FPS', () => {
    const hdd = fps({ ...top, systemDrive: 'HDD' })
    expect(hdd.warnings).toContain('hddSystem')
    expect(hdd.avg).toBe(fps(top).avg)
  })

  it('без процессора или видеокарты оценки нет', () => {
    expect(estimateFps(game, { ...top, gpuScore: null }, base, K)).toBeNull()
  })
})
