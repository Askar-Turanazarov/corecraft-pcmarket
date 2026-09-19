import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { button, pageTitle } from '@/components/ui/styles'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center sm:py-28">
      <p className="tabular font-display text-7xl font-semibold tracking-tight text-accent sm:text-8xl" aria-hidden>
        404
      </p>
      <h1 className={`${pageTitle} mt-6`}>{t('title')}</h1>
      <p className="mt-3 text-muted">{t('text')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={button('primary')}>
          {t('home')}
        </Link>
        <Link href="/catalog" className={button('secondary')}>
          {t('catalog')}
        </Link>
      </div>
    </section>
  )
}
