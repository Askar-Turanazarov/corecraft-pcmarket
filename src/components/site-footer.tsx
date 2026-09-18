import { getTranslations } from 'next-intl/server'
import { Cpu, ShieldCheck, Send, Truck } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export async function SiteFooter() {
  const t = await getTranslations()

  const facts = [
    { Icon: Truck, title: t('footer.deliveryTitle'), text: t('footer.deliveryText') },
    { Icon: Send, title: t('footer.paymentTitle'), text: t('footer.paymentText') },
    { Icon: ShieldCheck, title: t('footer.warrantyTitle'), text: t('footer.warrantyText') },
  ]

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_2fr]">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-[var(--radius-control)] border border-accent/40 text-accent">
              <Cpu className="size-4.5" />
            </span>
            <span className="font-display text-[15px] font-semibold">{t('brand.name')}</span>
          </Link>
          <p className="max-w-xs text-sm text-muted">{t('brand.tagline')}</p>
          <nav aria-label={t('footer.sections')} className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm">
            <Link href="/catalog" className="text-muted hover:text-foreground">{t('nav.catalog')}</Link>
            <Link href="/builder" className="text-muted hover:text-foreground">{t('nav.builder')}</Link>
            <Link href="/fps" className="text-muted hover:text-foreground">{t('nav.fps')}</Link>
            <Link href="/account" className="text-muted hover:text-foreground">{t('nav.account')}</Link>
          </nav>
        </div>

        <ul className="grid gap-6 sm:grid-cols-3">
          {facts.map(({ Icon, title, text }) => (
            <li key={title} className="space-y-2">
              <Icon className="size-5 text-accent" aria-hidden />
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-5 text-xs text-muted">
          <span>{t('footer.city')}</span>
          <span>© {new Date().getFullYear()} {t('brand.name')}. {t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  )
}
