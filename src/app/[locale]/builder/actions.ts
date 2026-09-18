'use server'

import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { addManyToCart } from '../cart/actions'
import { builderHref, loadBuild, readBuildSlugs, type BuildSlugs } from './build'

// Сборку пересобираем из slug на сервере: id и цены от клиента не принимаем.

export async function saveBuild(raw: BuildSlugs) {
  const slugs = readBuildSlugs(raw)
  const { items } = await loadBuild(slugs)
  if (items.length === 0) return

  const session = await auth()
  // Одинаковые накопители — одна строка с qty: в BuildItem пара (сборка, товар) уникальна.
  const qty = new Map<string, number>()
  for (const { product } of items) qty.set(product.id, (qty.get(product.id) ?? 0) + 1)

  const build = await db.build.create({
    data: {
      userId: session?.user?.id ?? null,
      items: { create: [...qty].map(([productId, n]) => ({ productId, qty: n })) },
    },
  })
  redirect({ href: builderHref(slugs, {}, { saved: build.shareId }), locale: await getLocale() })
}

export async function addBuildToCart(raw: BuildSlugs) {
  const slugs = readBuildSlugs(raw)
  const { items } = await loadBuild(slugs)
  await addManyToCart(items.map((i) => i.product.id))
  redirect({ href: '/cart', locale: await getLocale() })
}
