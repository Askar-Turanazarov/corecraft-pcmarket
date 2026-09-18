import type { MetadataRoute } from 'next'

const BASE = process.env.AUTH_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    // Личные и служебные страницы индексировать незачем. Путь админки сюда
    // не пишем: robots.txt публичен и выдал бы его.
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/*/cart', '/*/checkout', '/*/account', '/*/compare'] },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
