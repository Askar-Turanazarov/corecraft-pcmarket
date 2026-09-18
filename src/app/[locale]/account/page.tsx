import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cn } from '@/lib/cn'
import { formatUzs } from '@/lib/money'
import { orderNumber, readSnapshot } from '@/lib/orders'
import { payOrder } from '../checkout/actions'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'text-warning',
  PAID: 'text-accent',
  SHIPPED: 'text-accent',
  DONE: 'text-muted',
  CANCELLED: 'text-danger',
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
      include: { items: { include: { product: { select: { priceUzs: true } } } } },
    }),
  ])
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Tashkent' })
  const error = typeof query.error === 'string' && ERRORS.includes(query.error) ? query.error : undefined

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted">{session!.user.name ?? session!.user.email}</p>

      {query.paid && (
        <p className="mt-6 flex gap-2 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-accent" />
          {t('paid')}
        </p>
      )}
      {error && (
        <p className="mt-6 flex gap-2 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-danger" />
          {tCheckout(`errors.${error}`)}
        </p>
      )}

      <h2 className="mt-10 text-lg font-medium">{t('orders')}</h2>
      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('noOrders')}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-border bg-surface p-4 text-sm">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-medium">№{orderNumber(order.id)}</span>
                  <span className="text-muted">{date.format(order.createdAt)}</span>
                  <span className={cn('font-medium', STATUS_CLASS[order.status])}>{t(`status.${order.status}`)}</span>
                  <span className="ml-auto tabular-nums">{formatUzs(order.totalUzs, locale)}</span>
                </summary>
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-muted">
                  {readSnapshot(order.itemsSnapshot).map((item) => (
                    <li key={item.productId} className="flex justify-between gap-3">
                      <Link href={`/catalog/${item.slug}`} className="hover:text-foreground">{item.name}</Link>
                      <span className="shrink-0">×{item.qty}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-muted">{order.address} · {order.phone}</p>
              </details>
              {order.status === 'PENDING' && (
                <form action={payOrder.bind(null, order.id)} className="mt-3">
                  <button type="submit" className="rounded-lg bg-accent px-4 py-1.5 font-medium text-background hover:bg-accent-strong">
                    {t('pay')}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-lg font-medium">{t('builds')}</h2>
      {builds.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('noBuilds')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface text-sm">
          {builds.map((build) => (
            <li key={build.id}>
              <Link href={`/builder/${build.shareId}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:text-accent">
                <span>{date.format(build.createdAt)}</span>
                <span className="text-muted">{t('parts', { count: build.items.reduce((n, i) => n + i.qty, 0) })}</span>
                <span className="ml-auto tabular-nums">
                  {formatUzs(build.items.reduce((sum, i) => sum + i.product.priceUzs * i.qty, 0), locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
