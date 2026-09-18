import { getTranslations } from 'next-intl/server'
import { Cpu, LogOut, ShoppingCart, User } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { auth, signOut } from '@/lib/auth'
import { getCart } from '@/lib/cart'
import { readCompare } from '@/lib/compare'
import { LocaleSwitcher } from './locale-switcher'

export async function SiteHeader() {
  const t = await getTranslations()
  const [session, cart, compare] = await Promise.all([auth(), getCart(), readCompare()])

  const links = (
    <>
      <Link href="/catalog" className="shrink-0 hover:text-foreground">{t('nav.catalog')}</Link>
      <Link href="/builder" className="shrink-0 hover:text-foreground">{t('nav.builder')}</Link>
      <Link href="/fps" className="shrink-0 hover:text-foreground">{t('nav.fps')}</Link>
      {compare.length > 0 && (
        <Link href="/compare" className="shrink-0 hover:text-foreground">
          {t('nav.compare', { count: compare.length })}
        </Link>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-semibold">
          <Cpu className="size-5 text-accent" />
          {t('brand.name')}
        </Link>

        <nav aria-label={t('nav.main')} className="hidden gap-5 text-sm text-muted md:flex">
          {links}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/cart"
            aria-label={t('nav.cart')}
            className="relative text-muted hover:text-foreground"
          >
            <ShoppingCart className="size-5" />
            {cart.count > 0 && (
              <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-semibold leading-4 text-background">
                {cart.count}
              </span>
            )}
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/account"
                aria-label={t('nav.account')}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
              >
                <User className="size-5" />
                <span className="hidden sm:inline">{t('nav.account')}</span>
              </Link>
              <form
                action={async () => {
                  'use server'
                  await signOut()
                }}
              >
                <button
                  type="submit"
                  aria-label={t('nav.signOut')}
                  className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
                >
                  <LogOut className="size-5" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              aria-label={t('nav.signIn')}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
            >
              <User className="size-5" />
              <span className="hidden sm:inline">{t('nav.signIn')}</span>
            </Link>
          )}
        </div>
      </div>
      {/* На телефоне — отдельная прокручиваемая строка, чтобы разделы не прятались за меню. */}
      <nav
        aria-label={t('nav.main')}
        className="flex gap-5 overflow-x-auto border-t border-border px-4 py-2 text-sm text-muted md:hidden"
      >
        {links}
      </nav>
    </header>
  )
}
