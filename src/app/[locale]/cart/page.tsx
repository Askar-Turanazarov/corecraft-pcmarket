import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import { getCart } from '@/lib/cart'
import { Price } from '@/components/shop/price'
import { productName } from '@/components/shop/localized'
import { CategoryIcon } from '@/components/shop/category-icon'
import { setCartQty, removeFromCart } from './actions'

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('cart')
  const cart = await getCart()

  if (cart.items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-3 text-muted">{t('empty')}</p>
        <Link
          href="/catalog"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-on-accent hover:bg-accent-strong"
        >
          {t('emptyCta')}
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {cart.items.map(({ product, qty }) => (
          <li key={product.id} className="flex flex-wrap items-center gap-4 py-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-surface">
              <CategoryIcon category={product.category} className="size-6 text-muted" />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/catalog/${product.slug}`}
                className="line-clamp-2 font-medium hover:text-accent"
              >
                {productName(product, locale)}
              </Link>
              <p className="text-sm text-muted">{product.brand}</p>
              {product.stock < 1 && (
                <p className="text-sm text-danger">{t('outOfStock')}</p>
              )}
            </div>

            <form
              action={async (form: FormData) => {
                'use server'
                await setCartQty(product.id, Number(form.get('qty')))
              }}
              className="flex items-center rounded-lg border border-border"
            >
              {/* Две кнопки одной формы: значение приходит от нажатой. */}
              <button
                type="submit"
                name="qty"
                value={qty - 1}
                aria-label={t('decrease')}
                className="px-2.5 py-1.5 text-muted hover:text-foreground"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center tabular-nums" aria-label={t('quantity')}>
                {qty}
              </span>
              <button
                type="submit"
                name="qty"
                value={qty + 1}
                disabled={qty >= product.stock}
                aria-label={t('increase')}
                className="px-2.5 py-1.5 text-muted hover:text-foreground disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </form>

            <Price amountUzs={product.priceUzs * qty} locale={locale} className="ml-auto text-right sm:w-40" />

            <form
              action={async () => {
                'use server'
                await removeFromCart(product.id)
              }}
            >
              <button
                type="submit"
                aria-label={t('remove')}
                className="text-muted hover:text-danger"
              >
                <Trash2 className="size-5" />
              </button>
            </form>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <Link href="/catalog" className="text-sm text-muted hover:text-foreground">
          {t('continue')}
        </Link>

        <div className="text-right">
          <p className="text-sm text-muted">{t('total')}</p>
          <Price amountUzs={cart.totalUzs} locale={locale} large />
          <Link
            href="/checkout"
            className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 font-medium text-on-accent hover:bg-accent-strong"
          >
            {t('checkout')}
          </Link>
        </div>
      </div>
    </section>
  )
}
