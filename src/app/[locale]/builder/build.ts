import { db } from '@/lib/db'
import { SLOTS, type Build, type Slot } from '@/lib/compat'

// Сборка живёт в адресе: /builder?cpu=<slug>&gpu=<slug>&storage=a,b
// Ссылка на страницу — это уже ссылка на сборку, хранилище не нужно.
export type BuildSlugs = Partial<Record<Slot, string[]>>

export const MAX_STORAGE = 4

export function isSlot(value: unknown): value is Slot {
  return SLOTS.includes(value as Slot)
}

export function readBuildSlugs(raw: Record<string, string | string[] | undefined>): BuildSlugs {
  const slugs: BuildSlugs = {}
  for (const slot of SLOTS) {
    const value = raw[slot]
    const joined = Array.isArray(value) ? value.join(',') : value
    const list = joined?.split(',').filter(Boolean) ?? []
    if (list.length > 0) slugs[slot] = slot === 'storage' ? list.slice(0, MAX_STORAGE) : list.slice(0, 1)
  }
  return slugs
}

/** Адрес конструктора с изменёнными слотами; пустой список — слот очищается. */
export function builderHref(slugs: BuildSlugs, patch: BuildSlugs = {}, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams()
  for (const slot of SLOTS) {
    const list = patch[slot] ?? slugs[slot]
    if (list?.length) params.set(slot, list.join(','))
  }
  for (const [key, value] of Object.entries(extra)) params.set(key, value)
  const search = params.toString()
  return search ? `/builder?${search}` : '/builder'
}

/** Детали сборки из базы. Неизвестные и снятые с продажи slug молча отбрасываются. */
export async function loadBuild(slugs: BuildSlugs) {
  const all = Object.values(slugs).flat()
  const products = all.length
    ? await db.product.findMany({ where: { slug: { in: all }, kind: 'COMPONENT', isActive: true } })
    : []

  const bySlug = (slot: Slot, slug: string) =>
    products.find((p) => p.slug === slug && p.category === slot)

  const build: Build = {}
  const items: Array<{ slot: Slot; product: (typeof products)[number] }> = []
  for (const slot of SLOTS) {
    for (const slug of slugs[slot] ?? []) {
      const product = bySlug(slot, slug)
      if (!product) continue
      items.push({ slot, product })
      if (slot === 'storage') build.storage = [...(build.storage ?? []), product]
      else build[slot] = product
    }
  }
  return { build, items }
}
