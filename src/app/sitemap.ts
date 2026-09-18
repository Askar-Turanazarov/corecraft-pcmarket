import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { routing } from '@/i18n/routing'

const BASE = process.env.AUTH_URL ?? 'http://localhost:3000'
const PAGES = ['', '/catalog', '/builder', '/fps']

// Каждая страница на трёх языках, с hreflang-ссылками друг на друга.
// Админки, кабинета и корзины здесь нет намеренно.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  })
  const paths = [
    ...PAGES.map((path) => ({ path, lastModified: undefined })),
    ...products.map((p) => ({ path: `/catalog/${p.slug}`, lastModified: p.updatedAt })),
  ]
  const languages = (path: string) =>
    Object.fromEntries(routing.locales.map((l) => [l, `${BASE}/${l}${path}`]))

  return paths.flatMap(({ path, lastModified }) =>
    routing.locales.map((locale) => ({
      url: `${BASE}/${locale}${path}`,
      lastModified,
      alternates: { languages: languages(path) },
    })),
  )
}
