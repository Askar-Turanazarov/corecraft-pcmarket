'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { CameraView, ScenePart } from './build-preview'

// Масштаб: 1 единица = 100 мм. Корпус центрирован в нуле:
// x — от стенки с материнкой (-) к стеклу (+), y — вверх, z — от тыла (-) к фронту (+).
type V3 = [number, number, number]

const ACCENT = '#4ade80'
const CYAN = '#22d3ee'
const MAGENTA = '#e879f9'
const RGB = [ACCENT, CYAN, MAGENTA]

const HX = 1.15 // полуширина корпуса 230 мм
const HY = 2.4 // полувысота 480 мм
const HZ = 2.25 // полуглубина 450 мм

// Верхний тыльный угол материнки — от него меряем все детали на плате (в мм, как в спеках).
const BX = -HX + 0.08
const BY = HY - 0.25
const BZ = -HZ + 0.25
const b = (u: number, v: number, x = 0): V3 => [BX + x, BY - v / 100, BZ + u / 100]

// [ширина (к фронту), высота] в мм
const BOARDS: Record<string, [number, number]> = {
  ATX: [244, 305],
  MATX: [244, 244],
  ITX: [170, 170],
}
const SOCKET = { u: 95, v: 70 }
const PCIE_V = 130

const VIEWS: Record<CameraView, V3> = {
  front: [0, 0.6, 11],
  side: [11, 0.6, 0],
  top: [0, 12, 0.01], // не ровно над целью, иначе OrbitControls теряет ориентацию
  iso: [7, 5, 8],
}

// Смещения «откуда прилетает» деталь — константы модуля, чтобы r3f не переприменял position.
const SLIDE: V3 = [2.5, 0, 0] // на плату — сбоку, через стекло
const DROP: V3 = [0, 2.5, 0] // остальное — сверху

type MatProps = {
  ghost?: boolean
  color?: string
  emissive?: string
  metal?: number
  rough?: number
  opacity?: number
}

// Один материал на всё: призрак — полупрозрачный каркас, иначе обычный PBR.
// Металличность низкая: без env-карты металл отражает пустоту и выглядит чёрным.
function Mat({ ghost, color = '#3f3f46', emissive, metal = 0.2, rough = 0.5, opacity = 1 }: MatProps) {
  if (ghost) {
    return <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.18} depthWrite={false} />
  }
  return (
    <meshStandardMaterial
      color={emissive ?? color}
      metalness={metal}
      roughness={rough}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissive ? 2 : 0}
      // светящиеся полоски не пропускаем через tone mapping — так они «горят» без bloom
      toneMapped={!emissive}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity === 1}
    />
  )
}

function Box({ size, pos, ...mat }: { size: V3; pos: V3 } & MatProps) {
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <Mat {...mat} />
    </mesh>
  )
}

// Вентилятор: RGB-кольцо + крутящаяся крыльчатка. Ось по умолчанию — z.
function Fan({ pos, r = 0.58, axis = 'z', color = ACCENT, ghost }: {
  pos: V3
  r?: number
  axis?: 'y' | 'z'
  color?: string
  ghost?: boolean
}) {
  const spin = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (spin.current && !ghost) spin.current.rotation.z += dt * 5
  })
  return (
    <group position={pos} rotation={axis === 'y' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <mesh>
        <torusGeometry args={[r, 0.035, 8, 32]} />
        <Mat ghost={ghost} emissive={color} />
      </mesh>
      <group ref={spin}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r * 0.28, r * 0.28, 0.08, 16]} />
          <Mat ghost={ghost} color="#18181b" />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation={[0, 0, (i * 2 * Math.PI) / 5]}>
            <mesh position={[r * 0.6, 0, 0]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[r * 0.62, r * 0.3, 0.015]} />
              <Mat ghost={ghost} color="#3f3f46" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

// Анимация установки: при монтировании группа едет из смещения в ноль с ease-out ~0.6 с.
// Новая деталь = новый key = новый монтаж, поэтому «сравнение с прошлым рендером» делает React.
function Install({ from, children }: { from: V3; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(0)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g || t.current >= 1) return
    t.current = Math.min(1, t.current + dt / 0.6)
    const k = 1 - (1 - t.current) ** 3
    g.position.set(from[0] * (1 - k), from[1] * (1 - k), from[2] * (1 - k))
  })
  return (
    <group ref={ref} position={from}>
      {children}
    </group>
  )
}

function Case({ ghost }: { ghost?: boolean }) {
  const dark = '#101216'
  return (
    <group>
      <Box size={[0.04, HY * 2, HZ * 2]} pos={[-HX, 0, 0]} ghost={ghost} color={dark} />
      <Box size={[HX * 2, 0.04, HZ * 2]} pos={[0, -HY, 0]} ghost={ghost} color={dark} />
      <Box size={[HX * 2, HY * 2, 0.04]} pos={[0, 0, -HZ]} ghost={ghost} color={dark} />
      {/* верх и фронт — сетка: полупрозрачные, чтобы виды front/top видели начинку */}
      <Box size={[HX * 2, 0.04, HZ * 2]} pos={[0, HY, 0]} ghost={ghost} color={dark} opacity={0.35} />
      <Box size={[HX * 2, HY * 2, 0.04]} pos={[0, 0, HZ]} ghost={ghost} color={dark} opacity={0.3} />
      {/* ponytail: стекло — прозрачный standard, не transmission (тот рендерит сцену второй раз); потолок — нет преломления */}
      <Box size={[0.02, HY * 2, HZ * 2]} pos={[HX, 0, 0]} ghost={ghost} color="#94a3b8" metal={0} rough={0.05} opacity={0.12} />
      {/* кожух БП */}
      <Box size={[HX * 2 - 0.08, 0.03, HZ * 2 - 0.08]} pos={[0, -1.45, 0]} ghost={ghost} color="#16181d" />
      {/* RGB-полоса по переднему краю */}
      <Box size={[0.03, HY * 1.8, 0.03]} pos={[HX - 0.05, 0, HZ + 0.03]} ghost={ghost} emissive={ACCENT} />
      <Fan pos={[0.1, 1.2, HZ - 0.12]} ghost={ghost} color={CYAN} />
      <Fan pos={[0.1, 0, HZ - 0.12]} ghost={ghost} color={MAGENTA} />
      <Fan pos={[0, 1.55, -HZ + 0.12]} ghost={ghost} color={ACCENT} />
    </group>
  )
}

function Motherboard({ size, ghost }: { size: [number, number]; ghost?: boolean }) {
  const [w, h] = size
  return (
    <group>
      <Box size={[0.03, h / 100, w / 100]} pos={b(w / 2, h / 2)} ghost={ghost} color="#334155" />
      {/* разъём PCIe x16 */}
      <Box size={[0.05, 0.08, 0.9]} pos={b(50, PCIE_V, 0.03)} ghost={ghost} color="#0f1115" />
      {/* зелёная подсветка вдоль края — «игровая» плата */}
      <Box size={[0.02, h / 100 - 0.2, 0.03]} pos={b(w - 5, h / 2, 0.03)} ghost={ghost} emissive={ACCENT} />
    </group>
  )
}

function Cpu({ ghost }: { ghost?: boolean }) {
  return <Box size={[0.04, 0.4, 0.4]} pos={b(SOCKET.u, SOCKET.v, 0.035)} ghost={ghost} color="#a1a1aa" metal={0.5} rough={0.3} />
}

function Ram({ sticks, boardW, ghost }: { sticks: number; boardW: number; ghost?: boolean }) {
  // ponytail: на ITX влезает 2 слота, на остальных 4 — лишнее обрезаем, а не рисуем за платой
  const n = Math.max(1, Math.min(sticks, boardW < 200 ? 2 : 4))
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <group key={i}>
          <Box size={[0.32, 1.33, 0.07]} pos={b(150 + i * 10, SOCKET.v, 0.17)} ghost={ghost} color="#475569" />
          <Box size={[0.04, 1.33, 0.075]} pos={b(150 + i * 10, SOCKET.v, 0.35)} ghost={ghost} emissive={RGB[i % 3]} />
        </group>
      ))}
    </group>
  )
}

function Gpu({ lengthMm, ghost }: { lengthMm: number; ghost?: boolean }) {
  const L = lengthMm
  const fans = L >= 260 ? 3 : 2
  const r = Math.min(0.45, L / 100 / (fans * 2) - 0.03)
  // карта торчит из слота к стеклу на 120 мм, толщина 50 мм вниз; хвост на 15 мм уходит за тыльную планку
  return (
    <group>
      <Box size={[1.2, 0.5, L / 100]} pos={b(L / 2 - 15, PCIE_V + 25, 0.68)} ghost={ghost} color="#3f3f46" />
      <Box size={[0.03, 0.06, (L / 100) * 0.8]} pos={b(L / 2 - 15, PCIE_V + 8, 1.29)} ghost={ghost} emissive={MAGENTA} />
      {Array.from({ length: fans }, (_, i) => (
        <Fan key={i} pos={b((L / fans) * (i + 0.5) - 15, PCIE_V + 51, 0.68)} r={r} axis="y" ghost={ghost} color={CYAN} />
      ))}
    </group>
  )
}

function AirCooler({ heightMm, ghost }: { heightMm: number; ghost?: boolean }) {
  const tower = heightMm / 100 - 0.1
  const x = 0.1 + tower / 2
  return (
    <group>
      <Box size={[0.1, 0.45, 0.45]} pos={b(SOCKET.u, SOCKET.v, 0.1)} ghost={ghost} color="#b45309" metal={0.5} rough={0.3} />
      <Box size={[tower, 1.2, 0.5]} pos={b(SOCKET.u, 65, x)} ghost={ghost} color="#d4d4d8" metal={0.5} rough={0.35} />
      <Fan pos={b(SOCKET.u + 28, 65, x)} r={0.56} ghost={ghost} color={ACCENT} />
    </group>
  )
}

function Aio({ radiatorMm, ghost }: { radiatorMm: number; ghost?: boolean }) {
  const R = radiatorMm / 100
  const fans = radiatorMm === 280 ? 2 : Math.max(1, Math.round(radiatorMm / 120))
  const y = HY - 0.1 - 0.135
  const z = HZ - 0.3 - R / 2 // радиатор прижат к фронту, как ставят на верх корпуса
  return (
    <group>
      <mesh position={b(SOCKET.u, SOCKET.v, 0.18)} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.25, 32]} />
        <Mat ghost={ghost} color="#18181b" />
      </mesh>
      <mesh position={b(SOCKET.u, SOCKET.v, 0.31)} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.02, 32]} />
        <Mat ghost={ghost} emissive={CYAN} />
      </mesh>
      {/* ponytail: без шлангов — потолок: не видно, откуда идёт жидкость */}
      <Box size={[1.2, 0.27, R]} pos={[0, y, z]} ghost={ghost} color="#3f3f46" />
      {Array.from({ length: fans }, (_, i) => (
        <Fan
          key={i}
          pos={[0, y - 0.17, z - R / 2 + (R / fans) * (i + 0.5)]}
          r={R / fans / 2 - 0.04}
          axis="y"
          ghost={ghost}
          color={MAGENTA}
        />
      ))}
    </group>
  )
}

function Psu({ ghost }: { ghost?: boolean }) {
  return <Box size={[1.5, 0.86, 1.6]} pos={[-HX + 0.85, -HY + 0.48, -HZ + 0.85]} ghost={ghost} color="#27272a" />
}

// M.2 — пластина на плате под видеокартой; SATA/HDD — в корзине под кожухом у фронта.
function Drive({ type, index, boardH, ghost }: { type: string; index: number; boardH: number; ghost?: boolean }) {
  if (type === 'NVME') {
    // ponytail: на мелких платах слоты M.2 упираются в край и накладываются друг на друга
    const v = Math.min(205 + index * 45, boardH - 15)
    return <Box size={[0.02, 0.22, 0.8]} pos={b(100, v, 0.03)} ghost={ghost} color="#3f3f46" metal={0.7} />
  }
  const hdd = type === 'HDD'
  const size: V3 = hdd ? [1.02, 0.26, 1.47] : [0.7, 0.07, 1.0]
  // ponytail: корзина на 3 диска, дальше диски вылезут за кожух
  const y = -HY + 0.1 + index * 0.3 + size[1] / 2
  return <Box size={size} pos={[0.4, y, HZ - 0.35 - size[2] / 2]} ghost={ghost} color={hdd ? '#52525b' : '#27272a'} metal={0.7} />
}

export default function BuildScene({ parts, view }: { parts: ScenePart[]; view: { name: CameraView; id: number } }) {
  const find = (slot: ScenePart['slot']) => parts.find((p) => p.slot === slot)
  const k = (p: ScenePart) => `${p.slot}-${p.name}`

  const mb = find('motherboard')
  const board = BOARDS[mb?.formFactor ?? 'ATX'] ?? BOARDS.ATX
  const cpu = find('cpu')
  const ram = find('ram')
  const gpu = find('gpu')
  const cooler = find('cooler')
  const psu = find('psu')
  const box = find('case')
  const storage = parts.filter((p) => p.slot === 'storage')
  // M.2 и корзина заполняются независимо: индекс = сколько дисков того же вида было раньше
  const isM2 = (p: ScenePart) => (p.storageType ?? 'NVME') === 'NVME'

  return (
    <Canvas dpr={[1, 2]} gl={{ preserveDrawingBuffer: true, antialias: true }} camera={{ position: VIEWS.iso, fov: 40 }}>
      <color attach="background" args={['#12151d']} />
      <ambientLight intensity={1.2} />
      {/* основной свет со стороны стекла — иначе внутренности в тени собственных стенок */}
      <directionalLight position={[8, 6, 4]} intensity={2.2} />
      <directionalLight position={[-3, 5, 8]} intensity={0.8} />
      <pointLight position={[0.3, 0.5, 0]} intensity={4} distance={5} color={ACCENT} />

      {box ? <Install key={k(box)} from={DROP}><Case /></Install> : <Case ghost />}
      {mb ? <Install key={k(mb)} from={SLIDE}><Motherboard size={board} /></Install> : <Motherboard size={board} ghost />}
      {cpu ? <Install key={k(cpu)} from={SLIDE}><Cpu /></Install> : <Cpu ghost />}
      {ram ? (
        <Install key={k(ram)} from={SLIDE}><Ram sticks={ram.memorySticks ?? 2} boardW={board[0]} /></Install>
      ) : (
        <Ram sticks={2} boardW={board[0]} ghost />
      )}
      {gpu ? (
        <Install key={k(gpu)} from={SLIDE}><Gpu lengthMm={gpu.lengthMm ?? 300} /></Install>
      ) : (
        <Gpu lengthMm={300} ghost />
      )}
      {cooler ? (
        <Install key={k(cooler)} from={cooler.coolerType === 'AIO' ? DROP : SLIDE}>
          {cooler.coolerType === 'AIO' ? (
            <Aio radiatorMm={cooler.radiatorMm ?? 360} />
          ) : (
            <AirCooler heightMm={cooler.heightMm ?? 155} />
          )}
        </Install>
      ) : (
        <AirCooler heightMm={155} ghost />
      )}
      {psu ? <Install key={k(psu)} from={DROP}><Psu /></Install> : <Psu ghost />}
      {storage.length === 0 && <Drive type="NVME" index={0} boardH={board[1]} ghost />}
      {storage.map((p, i) => {
        const type = p.storageType ?? 'NVME'
        const index = storage.slice(0, i).filter((s) => isM2(s) === isM2(p)).length
        return (
          <Install key={`${i}-${p.name}`} from={isM2(p) ? SLIDE : DROP}>
            <Drive type={type} index={index} boardH={board[1]} />
          </Install>
        )
      })}

      <CameraRig view={view} />
      <OrbitControls makeDefault enableDamping minDistance={5} maxDistance={18} />
    </Canvas>
  )
}

// Плавный перелёт камеры к пресету; после прибытия отпускает камеру OrbitControls.
function CameraRig({ view }: { view: { name: CameraView; id: number } }) {
  const target = useRef<THREE.Vector3 | null>(null)
  useEffect(() => {
    target.current = new THREE.Vector3(...VIEWS[view.name])
  }, [view])
  useFrame((state, dt) => {
    if (!target.current) return
    state.camera.position.lerp(target.current, 1 - Math.exp(-dt * 6))
    if (state.camera.position.distanceTo(target.current) < 0.02) target.current = null
  })
  return null
}
