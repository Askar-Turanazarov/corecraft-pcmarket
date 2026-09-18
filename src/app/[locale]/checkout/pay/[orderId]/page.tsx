import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { FlaskConical } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { orderNumber } from '@/lib/orders'
import { isMockPayments } from '@/lib/telegram/bot'
import { Price } from '@/components/shop/price'
import { mockPay } from '../../actions'

// Страница-заглушка вместо счёта Telegram: работает, только пока не задан токен провайдера.
export default async function MockPayPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>
}) {
  const { locale, orderId } = await params
  setRequestLocale(locale)
  if (!isMockPayments()) notFound()

  const session = await auth()
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== session?.user?.id) notFound()
  const t = await getTranslations('checkout')

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border border-warning/40 bg-surface p-6">
        <p className="flex items-center gap-2 text-sm text-warning">
          <FlaskConical className="size-4" />
          {t('mockBadge')}
        </p>
        <h1 className="mt-4 text-xl font-semibold">{t('payTitle', { number: orderNumber(order.id) })}</h1>
        <Price amountUzs={order.totalUzs} locale={locale as Locale} large className="mt-3" />

        {order.status === 'PENDING' ? (
          <form action={mockPay.bind(null, order.id)} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-lg bg-accent py-3 font-medium text-on-accent hover:bg-accent-strong"
            >
              {t('mockPay')}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">{t('alreadyPaid')}</p>
        )}
        <Link href="/account" className="mt-4 block text-center text-sm text-muted hover:text-foreground">
          {t('later')}
        </Link>
      </div>
    </section>
  )
}
