import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')

  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        {t('title')}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">{t('subtitle')}</p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/builder"
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:bg-accent-strong"
        >
          {t('ctaBuilder')}
        </Link>
        <Link
          href="/catalog"
          className="rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-surface"
        >
          {t('ctaCatalog')}
        </Link>
      </div>
    </section>
  )
}
