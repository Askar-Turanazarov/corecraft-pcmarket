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
import { badge, button, panel } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
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
      <div className={cn(panel, 'glow p-6 sm:p-8')}>
        <span className={badge('warning', 'px-3 py-1')}>
          <FlaskConical className="size-3.5" aria-hidden />
          {t('mockBadgeShort')}
        </span>
        <h1 className="mt-5 font-medium">{t('payTitle', { number: orderNumber(order.id) })}</h1>
        <Price
          amountUzs={order.totalUzs}
          locale={locale as Locale}
          large
          className="mt-2"
        />
        <p className="mt-4 text-sm text-warning">{t('mockBadge')}</p>

        {order.status === 'PENDING' ? (
          <form action={mockPay.bind(null, order.id)} className="mt-6">
            <button type="submit" className={button('primary', 'lg', 'w-full')}>
              {t('mockPay')}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">{t('alreadyPaid')}</p>
        )}
        <Link href="/account" className={button('ghost', 'md', 'mt-2 w-full')}>
          {t('later')}
        </Link>
      </div>
    </section>
  )
}
