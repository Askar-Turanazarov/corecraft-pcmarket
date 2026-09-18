import {
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Layers,
  Monitor,
  Mouse,
  Package,
  PcCase,
  Plug,
  Microchip,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  gpu: Microchip,
  motherboard: CircuitBoard,
  ram: Layers,
  storage: HardDrive,
  psu: Plug,
  case: PcCase,
  cooler: Fan,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
  laptop: Laptop,
  prebuilt: Box,
}

export function CategoryIcon({
  category,
  className,
}: {
  category: string
  className?: string
}) {
  const Icon = ICONS[category] ?? Package
  return <Icon className={className} aria-hidden />
}
