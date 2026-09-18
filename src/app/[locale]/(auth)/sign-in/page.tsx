import { getTranslations } from 'next-intl/server'
import { AuthForm } from '../auth-form'
import { signInAction } from '../actions'
import { TelegramLogin } from '../telegram-login'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const t = await getTranslations('auth')
  const bot = process.env.TELEGRAM_BOT_USERNAME

  return (
    <div className="w-full max-w-sm space-y-6">
      <AuthForm mode="signIn" action={signInAction} next={next} />
      {bot && (
        <div className="space-y-3 border-t border-border pt-6">
          <p className="text-sm text-muted">{t('orTelegram')}</p>
          <TelegramLogin bot={bot} next={next?.startsWith('/') && !next.startsWith('//') ? next : '/'} />
        </div>
      )}
    </div>
  )
}
