import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-semibold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-3 text-muted">{t('text')}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:bg-accent-strong">
          {t('home')}
        </Link>
        <Link href="/catalog" className="rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-surface">
          {t('catalog')}
        </Link>
      </div>
    </section>
  )
}
