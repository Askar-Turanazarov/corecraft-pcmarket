import { cookies } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import { Cpu, LogOut, Scale, Search, ShoppingCart, User } from 'lucide-react'
import { Link, getPathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { auth, signOut } from '@/lib/auth'
import { getCart } from '@/lib/cart'
import { readCompare } from '@/lib/compare'
import { field } from '@/components/ui/styles'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LocaleSwitcher } from './locale-switcher'

const iconLink =
  'relative grid size-10 place-items-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-surface-2 hover:text-foreground'

function Count({ value }: { value: number }) {
  if (value < 1) return null
  return (
    <span className="tabular absolute right-0.5 top-0.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-semibold leading-4 text-on-accent">
      {value}
    </span>
  )
}

export async function SiteHeader() {
  const [t, locale, session, cart, compare, store] = await Promise.all([
    getTranslations(),
    getLocale(),
    auth(),
    getCart(),
    readCompare(),
    cookies(),
  ])
  const theme = store.get('theme')?.value === 'light' ? 'light' : 'dark'

  const links = (
    <>
      <Link href="/catalog" className="shrink-0 hover:text-foreground">{t('nav.catalog')}</Link>
      <Link href="/builder" className="shrink-0 hover:text-foreground">{t('nav.builder')}</Link>
      <Link href="/fps" className="shrink-0 hover:text-foreground">{t('nav.fps')}</Link>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-glass backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t('brand.name')}>
          <span className="glow grid size-8 place-items-center rounded-[var(--radius-control)] border border-accent/40 text-accent">
            <Cpu className="size-4.5" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight max-sm:hidden">{t('brand.name')}</span>
        </Link>

        <nav aria-label={t('nav.main')} className="hidden gap-6 text-sm text-muted md:flex">
          {links}
        </nav>

        {/* Поиск ведёт в каталог обычной GET-формой — без JS. */}
        <form
          action={getPathname({ href: '/catalog', locale: locale as Locale })}
          role="search"
          className="relative ml-auto hidden max-w-xs flex-1 lg:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            name="q"
            type="search"
            aria-label={t('catalog.search')}
            placeholder={t('catalog.searchPlaceholder')}
            className={`${field} min-h-10 pl-9 text-sm`}
          />
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Link href="/catalog" aria-label={t('catalog.search')} className={`${iconLink} lg:hidden`}>
            <Search className="size-5" />
          </Link>
          {compare.length > 0 && (
            <Link href="/compare" aria-label={t('nav.compare', { count: compare.length })} className={iconLink}>
              <Scale className="size-5" />
              <Count value={compare.length} />
            </Link>
          )}
          <Link href="/cart" aria-label={t('nav.cart')} className={iconLink}>
            <ShoppingCart className="size-5" />
            <Count value={cart.count} />
          </Link>
          {session?.user ? (
            <>
              <Link href="/account" aria-label={t('nav.account')} className={iconLink}>
                <User className="size-5" />
              </Link>
              <form
                action={async () => {
                  'use server'
                  await signOut()
                }}
              >
                <button type="submit" aria-label={t('nav.signOut')} className={`${iconLink} cursor-pointer`}>
                  <LogOut className="size-5" />
                </button>
              </form>
            </>
          ) : (
            <Link href="/sign-in" aria-label={t('nav.signIn')} className={iconLink}>
              <User className="size-5" />
            </Link>
          )}
          <ThemeToggle initial={theme} labels={{ dark: t('theme.dark'), light: t('theme.light') }} />
          <LocaleSwitcher />
        </div>
      </div>

      {/* На телефоне — отдельная прокручиваемая строка, чтобы разделы не прятались за меню. */}
      <nav
        aria-label={t('nav.main')}
        className="flex gap-6 overflow-x-auto border-t border-border px-4 py-2.5 text-sm text-muted md:hidden"
      >
        {links}
      </nav>
    </header>
  )
}
