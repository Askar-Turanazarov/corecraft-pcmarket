'use client'

import dynamic from 'next/dynamic'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import {
  Camera,
  CircuitBoard,
  Cpu,
  Fan,
  Gpu,
  HardDrive,
  LoaderCircle,
  MemoryStick,
  Pause,
  PcCase,
  Play,
  Plug,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

export type ScenePart = {
  slot: 'cpu' | 'motherboard' | 'ram' | 'gpu' | 'storage' | 'cooler' | 'psu' | 'case'
  name: string
  formFactor?: string | null // motherboard: ATX | MATX | ITX
  lengthMm?: number | null // gpu: длина карты
  heightMm?: number | null // cooler (AIR): высота башни
  memorySticks?: number | null // ram
  coolerType?: string | null // AIR | AIO
  radiatorMm?: number | null // AIO: 240/280/360
  storageType?: string | null // NVME | SATA_SSD | HDD
}

export type CameraView = 'front' | 'side' | 'top' | 'iso'

const BOX = 'aspect-[4/3] w-full rounded-xl border border-border bg-surface'
const VIEWS: CameraView[] = ['front', 'side', 'top', 'iso']
const ICONS: Record<ScenePart['slot'], LucideIcon> = {
  cpu: Cpu,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  gpu: Gpu,
  storage: HardDrive,
  cooler: Fan,
  psu: Plug,
  case: PcCase,
}

function SceneLoading() {
  const t = useTranslations('scene')
  return (
    <div className={cn(BOX, 'flex items-center justify-center gap-2 text-muted')} aria-busy="true">
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      {t('loading')}
    </div>
  )
}

// three.js весит сотни килобайт и без window не работает — грузим только в браузере.
const BuildScene = dynamic(() => import('./scene'), { ssr: false, loading: SceneLoading })

// Проверяем WebGL один раз и кэшируем: каждый getContext создаёт контекст, а браузер держит их ~16.
let webgl: boolean | undefined
function hasWebGL() {
  if (webgl === undefined) {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    webgl = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  }
  return webgl
}
const subscribe = () => () => {}

export function BuildPreview({ parts }: { parts: ScenePart[] }) {
  const t = useTranslations('scene')
  const sliderId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  // null на сервере и при гидратации, дальше — реальный ответ браузера (без setState в эффекте)
  const webglOk = useSyncExternalStore(subscribe, hasWebGL, () => null)

  const total = parts.length
  // null = «показать всё»: новая деталь из конфигуратора сразу видна, даже если таймлайн трогали
  const [step, setStep] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [view, setView] = useState<{ name: CameraView; id: number }>({ name: 'iso', id: 0 })
  const [prevTotal, setPrevTotal] = useState(total)
  if (prevTotal !== total) {
    setPrevTotal(total)
    setStep(null)
  }
  const shown = Math.min(step ?? total, total)
  if (playing && shown >= total) setPlaying(false)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setStep((s) => Math.min((s ?? total) + 1, total)), 700)
    return () => clearInterval(id)
  }, [playing, total])

  const play = () => {
    if (playing) return setPlaying(false)
    if (shown >= total) setStep(0)
    setPlaying(true)
  }

  const snapshot = () => {
    const canvas = wrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'corecraft-build.png'
    a.click()
  }

  if (webglOk === false) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">{t('noWebgl')}</p>
        <ul className="mt-4 space-y-2">
          {parts.map((p, i) => {
            const Icon = ICONS[p.slot]
            return (
              <li key={i} className="flex items-center gap-3 text-sm">
                <Icon className="size-4 shrink-0 text-accent" aria-hidden />
                {p.name}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const btn = 'rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm hover:border-accent'

  return (
    <div className="space-y-3">
      <div ref={wrapRef} className={cn(BOX, 'relative overflow-hidden')}>
        {webglOk === null ? <SceneLoading /> : <BuildScene parts={parts.slice(0, shown)} view={view} />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView((cur) => ({ name: v, id: cur.id + 1 }))}
            className={cn(btn, view.name === v && 'border-accent text-accent')}
          >
            {t(v)}
          </button>
        ))}
        <button type="button" onClick={snapshot} className={cn(btn, 'ml-auto flex items-center gap-2')}>
          <Camera className="size-4" aria-hidden />
          {t('snapshot')}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={play}
          disabled={total === 0}
          aria-label={playing ? t('pause') : t('play')}
          className={cn(btn, 'p-2 disabled:opacity-50')}
        >
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </button>
        <label htmlFor={sliderId} className="sr-only">
          {t('timeline')}
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={total}
          value={shown}
          onChange={(e) => {
            setPlaying(false)
            setStep(Number(e.target.value))
          }}
          className="min-w-0 flex-1 accent-accent"
        />
        <span className="shrink-0 text-sm tabular-nums text-muted">{t('step', { n: shown, total })}</span>
      </div>
    </div>
  )
}
