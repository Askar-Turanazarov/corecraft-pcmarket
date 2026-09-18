import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { getCart } from '@/lib/cart'
import { isMockPayments } from '@/lib/telegram/bot'
import { Price } from '@/components/shop/price'
import { productName } from '@/components/shop/localized'
import { CheckoutForm } from './checkout-form'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'checkout' })
  return { title: t('title') }
}

export default async function CheckoutPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)
  const t = await getTranslations('checkout')

  // Заказ привязан к аккаунту — иначе его не найти в истории.
  const session = await auth()
  if (!session?.user) redirect({ href: '/sign-in?next=/checkout', locale })

  const cart = await getCart()
  if (cart.items.length === 0) redirect({ href: '/cart', locale })

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-[1fr_22rem]">
      <section>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('deliveryNote')}</p>
        <div className="mt-6">
          <CheckoutForm defaultName={session?.user?.name ?? ''} mock={isMockPayments()} />
        </div>
      </section>

      <aside className="h-fit rounded-xl border border-border bg-surface p-4 text-sm">
        <h2 className="font-medium">{t('summary')}</h2>
        <ul className="mt-3 space-y-2">
          {cart.items.map(({ product, qty }) => (
            <li key={product.id} className="flex justify-between gap-3">
              <Link href={`/catalog/${product.slug}`} className="line-clamp-2 hover:text-accent">
                {productName(product, locale)}
              </Link>
              <span className="shrink-0 text-muted">×{qty}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-muted">{t('total')}</p>
          <Price amountUzs={cart.totalUzs} locale={locale} large />
        </div>
      </aside>
    </div>
  )
}
