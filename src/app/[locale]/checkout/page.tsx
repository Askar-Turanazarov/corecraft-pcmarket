import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { getCart } from '@/lib/cart'
import { isMockPayments } from '@/lib/telegram/bot'
import { Price } from '@/components/shop/price'
import { productName } from '@/components/shop/localized'
import { CategoryIcon } from '@/components/shop/category-icon'
import { pageTitle, panel } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import { formatUzs } from '@/lib/money'
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className={pageTitle}>{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('deliveryNote')}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section className={cn(panel, 'p-5 sm:p-8')}>
          <CheckoutForm defaultName={session?.user?.name ?? ''} mock={isMockPayments()} />
        </section>

        <aside className={cn(panel, 'h-fit p-6 lg:sticky lg:top-24')}>
          <h2 className="font-medium">{t('summary')}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.items.map(({ product, qty }) => (
              <li key={product.id} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] border border-border bg-surface-2">
                  <CategoryIcon category={product.category} className="size-4 text-accent" />
                </span>
                <Link href={`/catalog/${product.slug}`} className="line-clamp-2 min-w-0 flex-1 hover:text-accent">
                  {productName(product, locale)}
                </Link>
                <span className="tabular shrink-0 text-right">
                  <span className="block">{formatUzs(product.priceUzs * qty, locale)}</span>
                  {qty > 1 && <span className="block text-xs text-muted">×{qty}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-muted">{t('total')}</p>
            <Price
              amountUzs={cart.totalUzs}
              locale={locale}
              large
              className="mt-1"
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
