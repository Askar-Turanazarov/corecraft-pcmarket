import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AlertTriangle, CheckCircle2, ChevronDown, User } from 'lucide-react'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cn } from '@/lib/cn'
import { formatUzs } from '@/lib/money'
import { orderNumber, readSnapshot } from '@/lib/orders'
import { payOrder } from '../checkout/actions'
import { isSlot, summaryLabels } from '../builder/build'
import { buildSummary, summaryLine } from '@/lib/build-summary'
import { badge, button, card, pageTitle, sectionTitle } from '@/components/ui/styles'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const STATUS_TONE: Record<string, Parameters<typeof badge>[0]> = {
  PENDING: 'warning',
  PAID: 'plasma',
  SHIPPED: 'plasma',
  DONE: 'neutral',
  CANCELLED: 'danger',
}
const ERRORS = ['notPayable', 'outOfStock', 'priceChanged']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('title') }
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) redirect({ href: '/sign-in?next=/account', locale })
  const userId = session!.user.id

  const [t, tCheckout, query, orders, builds] = await Promise.all([
    getTranslations('account'),
    getTranslations('checkout'),
    searchParams,
    db.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    db.build.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    }),
  ])
  const labels = await summaryLabels(locale)
  // Строка конфигурации вместо безликого «8 деталей» — сборку узнают по составу.
  const lineOf = (build: (typeof builds)[number]) =>
    summaryLine(buildSummary(build.items.flatMap(({ product, qty }) => {
      const slot = product.category
      return isSlot(slot) ? Array.from({ length: qty }, () => ({ slot, product })) : []
    }), labels))
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Tashkent' })
  const error = typeof query.error === 'string' && ERRORS.includes(query.error) ? query.error : undefined

  const name = session!.user.name ?? session!.user.email

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-4">
        <span className="glow grid size-14 shrink-0 place-items-center rounded-[var(--radius-card)] border border-accent/40 text-accent">
          <User className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className={pageTitle}>{t('title')}</h1>
          <p className="mt-1 truncate text-muted">{name}</p>
        </div>
      </div>

      {query.paid && (
        <p className="mt-6 flex gap-2 rounded-[var(--radius-card)] border border-plasma/40 bg-plasma/10 p-4 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-plasma" aria-hidden />
          {t('paid')}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 flex gap-2 rounded-[var(--radius-card)] border border-danger/40 bg-danger/10 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden />
          {tCheckout(`errors.${error}`)}
        </p>
      )}

      <section className="mt-10">
        <h2 className={sectionTitle}>{t('orders')}</h2>
        {orders.length === 0 ? (
          <div className={cn(card, 'mt-4 border-dashed bg-transparent p-6 text-sm text-muted')}>
            <p>{t('noOrders')}</p>
            <Link href="/catalog" className={button('secondary', 'md', 'mt-4')}>
              {t('toCatalog')}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className={cn(card, 'text-sm')}>
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 p-4 [&::-webkit-details-marker]:hidden">
                    <span className="tabular font-medium">№{orderNumber(order.id)}</span>
                    <span className="text-muted">{date.format(order.createdAt)}</span>
                    <span className={badge(STATUS_TONE[order.status] ?? 'neutral')}>{t(`status.${order.status}`)}</span>
                    <span className="tabular ml-auto font-medium">{formatUzs(order.totalUzs, locale)}</span>
                    <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <ul className="space-y-1.5">
                      {readSnapshot(order.itemsSnapshot).map((item) => (
                        <li key={item.productId} className="flex justify-between gap-3">
                          <Link href={`/catalog/${item.slug}`} className="hover:text-accent">{item.name}</Link>
                          <span className="tabular shrink-0 text-muted">×{item.qty}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-muted">{order.address} · {order.phone}</p>
                  </div>
                </details>
                {order.status === 'PENDING' && (
                  <form action={payOrder.bind(null, order.id)} className="px-4 pb-4">
                    <button type="submit" className={button('primary', 'md')}>
                      {t('pay')}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className={sectionTitle}>{t('builds')}</h2>
        {builds.length === 0 ? (
          <div className={cn(card, 'mt-4 border-dashed bg-transparent p-6 text-sm text-muted')}>
            <p>{t('noBuilds')}</p>
            <Link href="/builder" className={button('secondary', 'md', 'mt-4')}>
              {t('toBuilder')}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {builds.map((build) => (
              <li key={build.id}>
                <Link
                  href={`/builder/${build.shareId}`}
                  className={cn(card, 'group flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-sm transition-colors hover:border-accent/60')}
                >
                  <span className="text-muted">{date.format(build.createdAt)}</span>
                  <span className="tabular ml-auto font-medium">
                    {formatUzs(build.items.reduce((sum, i) => sum + i.product.priceUzs * i.qty, 0), locale)}
                  </span>
                  <span className="tabular basis-full group-hover:text-accent">
                    {lineOf(build) || t('parts', { count: build.items.reduce((n, i) => n + i.qty, 0) })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
