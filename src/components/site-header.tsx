import { getTranslations } from 'next-intl/server'
import { Cpu, LogOut, ShoppingCart, User } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { auth, signOut } from '@/lib/auth'
import { getCart } from '@/lib/cart'
import { LocaleSwitcher } from './locale-switcher'

export async function SiteHeader() {
  const t = await getTranslations()
  const [session, cart] = await Promise.all([auth(), getCart()])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Cpu className="size-5 text-accent" />
          {t('brand.name')}
        </Link>

        <nav className="hidden gap-5 text-sm text-muted md:flex">
          <Link href="/catalog" className="hover:text-foreground">{t('nav.catalog')}</Link>
          <Link href="/builder" className="hover:text-foreground">{t('nav.builder')}</Link>
          <Link href="/fps" className="hover:text-foreground">{t('nav.fps')}</Link>
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
    </header>
  )
}
