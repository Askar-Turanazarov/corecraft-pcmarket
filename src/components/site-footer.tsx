import { getTranslations } from 'next-intl/server'

export async function SiteFooter() {
  const t = await getTranslations()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <span>{t('brand.name')} — {t('footer.city')}</span>
        <span>© {new Date().getFullYear()} · {t('footer.rights')}</span>
      </div>
    </footer>
  )
}
