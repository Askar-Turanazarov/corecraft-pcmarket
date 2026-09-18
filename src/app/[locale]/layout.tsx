import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Onest, Unbounded } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import '../globals.css'

// Оба шрифта с кириллицей и расширенной латиницей — для русского и узбекского (oʻ, gʻ).
const onest = Onest({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-onest' })
const unbounded = Unbounded({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-unbounded' })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'brand' })
  return {
    metadataBase: new URL(process.env.AUTH_URL ?? 'http://localhost:3000'),
    // «Видеокарта RTX 4070 — CoreCraft PC»: бренд в каждом заголовке вкладки и выдачи.
    title: { default: t('name'), template: `%s — ${t('name')}` },
    description: t('tagline'),
    openGraph: { siteName: t('name'), locale, type: 'website' },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  // Тема из cookie рисуется сервером сразу — без вспышки неверной темы при загрузке.
  const theme = (await cookies()).get('theme')?.value === 'light' ? 'light' : 'dark'

  return (
    <html lang={locale} data-theme={theme} className={`${onest.variable} ${unbounded.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
