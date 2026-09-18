import { getTranslations } from 'next-intl/server'
import { Star } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cn } from '@/lib/cn'
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
    <section className="mt-10">
      <h2 className="flex flex-wrap items-center gap-3 text-lg font-medium">
        {t('title')}
        {reviews.length > 0 && (
          <span className="flex items-center gap-2 text-sm font-normal text-muted">
            <Stars value={avg} />
            {t('summary', { avg: avg.toFixed(1), count: reviews.length })}
          </span>
        )}
      </h2>

      {session?.user ? (
        <form action={saveReview.bind(null, productId)} className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-4 text-sm">
          <fieldset className="flex flex-wrap items-center gap-3">
            <legend className="sr-only">{t('rating')}</legend>
            <span className="text-muted">{t('rating')}</span>
            {[5, 4, 3, 2, 1].map((n) => (
              <label key={n} className="flex items-center gap-1">
                <input type="radio" name="rating" value={n} required defaultChecked={mine?.rating === n} className="accent-[var(--accent)]" />
                {n}
              </label>
            ))}
          </fieldset>
          <label className="block space-y-1.5">
            <span className="text-muted">{t('text')}</span>
            <textarea
              name="text"
              required
              minLength={3}
              maxLength={1000}
              rows={3}
              defaultValue={mine?.text}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-strong">
            {mine ? t('update') : t('submit')}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">
          <Link href={`/sign-in?next=/catalog/${slug}`} className="text-accent hover:underline">{t('signIn')}</Link>
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t('none')}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-border pb-4 text-sm last:border-0">
              <div className="flex flex-wrap items-center gap-3">
                <Stars value={r.rating} label={t('stars', { n: r.rating })} />
                <span className="font-medium">{r.user.name ?? t('anonymous')}</span>
                <span className="text-muted">{date.format(r.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-muted">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
