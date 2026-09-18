import { notFound } from 'next/navigation'
import { redirect } from '@/i18n/navigation'
import { db } from '@/lib/db'
import { isSlot, builderHref, type BuildSlugs } from '../build'

// Публичная ссылка на сохранённую сборку: разворачиваем её в адрес конструктора.
export default async function SharedBuildPage({
  params,
}: {
  params: Promise<{ locale: string; shareId: string }>
}) {
  const { locale, shareId } = await params
  const build = await db.build.findUnique({
    where: { shareId },
    include: { items: { include: { product: { select: { slug: true, category: true } } } } },
  })
  if (!build) notFound()

  const slugs: BuildSlugs = {}
  for (const { product, qty } of build.items) {
    if (!isSlot(product.category)) continue
    slugs[product.category] = [
      ...(slugs[product.category] ?? []),
      ...Array<string>(qty).fill(product.slug),
    ]
  }
  redirect({ href: builderHref(slugs), locale })
}
