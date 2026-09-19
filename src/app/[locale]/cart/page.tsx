import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { getCart } from '@/lib/cart'
import { Price } from '@/components/shop/price'
import { productName } from '@/components/shop/localized'
import { CategoryIcon } from '@/components/shop/category-icon'
import { keySpecs } from '@/components/shop/key-specs'
import { button, card, pageTitle, panel } from '@/components/ui/styles'
import { setCartQty, removeFromCart } from './actions'

const stepBtn =
  'grid size-11 cursor-pointer place-items-center text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40'

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, tUnit, tCheckout, cart] = await Promise.all([
    getTranslations('cart'), getTranslations('units'), getTranslations('checkout'), getCart(),
  ])
  const units = {
    gb: tUnit('gb'), mhz: tUnit('mhz'), ghz: tUnit('ghz'), w: tUnit('w'), mm: tUnit('mm'),
    cores: tUnit('cores'), tb: tUnit('tb'),
  }

  if (cart.items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20">
        <div className={cn(panel, 'glow flex flex-col items-center p-10 text-center')}>
          <span className="grid size-14 place-items-center rounded-[var(--radius-card)] border border-accent/40 text-accent">
            <ShoppingCart className="size-6" aria-hidden />
          </span>
          <h1 className={cn(pageTitle, 'mt-6 text-2xl sm:text-3xl')}>{t('title')}</h1>
          <p className="mt-2 text-muted">{t('empty')}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">{t('emptyHint')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/catalog" className={button('primary', 'lg')}>
              {t('emptyCta')}
            </Link>
            <Link href="/builder" className={button('secondary', 'lg')}>
              {t('emptyBuilder')}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className={pageTitle}>{t('title')}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          {cart.items.map(({ product, qty }) => {
            const specs = keySpecs(product, units)
            return (
              <li key={product.id} className={cn(card, 'flex flex-wrap items-center gap-x-4 gap-y-3 p-4')}>
                <span className="glow grid size-16 shrink-0 place-items-center rounded-[var(--radius-card)] border border-border bg-surface-2">
                  <CategoryIcon category={product.category} className="size-6 text-accent" />
                </span>

                <div className="min-w-0 flex-1 basis-48">
                  <Link href={`/catalog/${product.slug}`} className="line-clamp-2 font-medium hover:text-accent">
                    {productName(product, locale)}
                  </Link>
                  <p className="tabular mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                    <span>{product.brand}</span>
                    {specs.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </p>
                  {product.stock < 1 && <p className="mt-1 text-xs text-danger">{t('outOfStock')}</p>}
                </div>

                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <form
                    action={async (form: FormData) => {
                      'use server'
                      await setCartQty(product.id, Number(form.get('qty')))
                    }}
                    className="flex items-center rounded-[var(--radius-control)] border border-border bg-surface-2"
                  >
                    {/* Две кнопки одной формы: значение приходит от нажатой. */}
                    <button type="submit" name="qty" value={qty - 1} aria-label={t('decrease')} className={stepBtn}>
                      <Minus className="size-4" />
                    </button>
                    <span className="tabular w-8 text-center font-medium" aria-label={t('quantity')}>
                      {qty}
                    </span>
                    <button
                      type="submit"
                      name="qty"
                      value={qty + 1}
                      disabled={qty >= product.stock}
                      aria-label={t('increase')}
                      className={stepBtn}
                    >
                      <Plus className="size-4" />
                    </button>
                  </form>

                  <Price amountUzs={product.priceUzs * qty} locale={locale} className="ml-auto whitespace-nowrap text-right sm:min-w-36" />

                  <form
                    action={async () => {
                      'use server'
                      await removeFromCart(product.id)
                    }}
                  >
                    <button type="submit" aria-label={t('remove')} className={cn(button('ghost', 'md'), 'w-11 px-0 hover:text-danger')}>
                      <Trash2 className="size-5" />
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>

        <aside className={cn(panel, 'h-fit p-6 lg:sticky lg:top-24')}>
          <h2 className="font-medium">{t('summary')}</h2>
          <p className="tabular mt-1 text-sm text-muted">{t('count', { count: cart.count })}</p>
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-muted">{t('total')}</p>
            <Price
              amountUzs={cart.totalUzs}
              locale={locale}
              large
              className="mt-1"
            />
          </div>
          <Link href="/checkout" className={button('primary', 'lg', 'mt-6 w-full')}>
            {t('checkout')}
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-muted">{tCheckout('deliveryNote')}</p>
          <Link href="/catalog" className={button('ghost', 'md', 'mt-2 w-full')}>
            {t('continue')}
          </Link>
        </aside>
      </div>
    </section>
  )
}
