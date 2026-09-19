import { getTranslations } from 'next-intl/server'
import { Star } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cn } from '@/lib/cn'
import { button, card, field, sectionTitle } from '@/components/ui/styles'
import { saveReview } from '@/app/[locale]/catalog/[slug]/actions'

export function Stars({ value, label, className }: { value: number; label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex', className)} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('size-4', n <= Math.round(value) ? 'fill-warning text-warning' : 'text-border')} />
      ))}
    </span>
  )
}

export async function Reviews({ productId, slug, locale }: { productId: string; slug: string; locale: Locale }) {
  const [t, session, reviews] = await Promise.all([
    getTranslations('reviews'),
    auth(),
    db.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ])
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const mine = reviews.find((r) => r.userId === session?.user?.id)
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Tashkent' })

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className={cn(sectionTitle, 'flex flex-wrap items-center gap-x-4 gap-y-1')}>
        {t('title')}
        {reviews.length > 0 && (
          <span className="tabular flex items-center gap-2 font-sans text-sm font-normal tracking-normal text-muted">
            <Stars value={avg} />
            {t('summary', { avg: avg.toFixed(1), count: reviews.length })}
          </span>
        )}
      </h2>

      {session?.user ? (
        <form action={saveReview.bind(null, productId)} className={cn(card, 'mt-5 space-y-4 p-4 text-sm sm:p-5')}>
          <fieldset>
            <legend className="mb-2 font-medium">{t('rating')}</legend>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((n) => (
                <label
                  key={n}
                  className="tabular flex min-h-11 min-w-14 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 transition-colors duration-200 hover:border-accent/60 has-[:checked]:border-accent has-[:checked]:text-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
                >
                  <input type="radio" name="rating" value={n} required defaultChecked={mine?.rating === n} className="sr-only" />
                  <Star className="size-4 fill-warning text-warning" aria-hidden />
                  {n}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block space-y-1.5">
            <span className="font-medium">{t('text')}</span>
            <textarea
              name="text"
              required
              minLength={3}
              maxLength={1000}
              rows={4}
              defaultValue={mine?.text}
              className={field}
            />
          </label>
          <button type="submit" className={button('primary')}>
            {mine ? t('update') : t('submit')}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm">
          <Link href={`/sign-in?next=/catalog/${slug}`} className="text-accent hover:underline">{t('signIn')}</Link>
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="mt-5 text-sm text-muted">{t('none')}</p>
      ) : (
        <ul className="mt-5 divide-y divide-border">
          {reviews.map((r) => (
            <li key={r.id} className="py-4 text-sm first:pt-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">{r.user.name ?? t('anonymous')}</span>
                <Stars value={r.rating} label={t('stars', { n: r.rating })} />
                <span className="text-xs text-muted">{date.format(r.createdAt)}</span>
              </div>
              <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed text-muted">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
