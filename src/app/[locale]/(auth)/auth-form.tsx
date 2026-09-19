'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { button, field } from '@/components/ui/styles'
import type { AuthState } from './actions'

type Props = {
  mode: 'signIn' | 'signUp'
  action: (state: AuthState, form: FormData) => Promise<AuthState>
  next?: string
}

export function AuthForm({ mode, action, next }: Props) {
  const t = useTranslations('auth')
  const [state, formAction, pending] = useActionState(action, null)
  const isSignUp = mode === 'signUp'

  return (
    <form action={formAction} className="w-full space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {isSignUp ? t('signUpTitle') : t('signInTitle')}
        </h1>
        <p className="text-sm text-muted">{isSignUp ? t('signUpLead') : t('signInLead')}</p>
      </div>

      {isSignUp && <Field name="name" label={t('name')} />}
      <Field name="email" type="email" label={t('email')} required />
      <Field name="password" type="password" label={t('password')} required minLength={8} />

      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-control)] border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {t(state.error as 'invalidCredentials')}
        </p>
      )}

      <button type="submit" disabled={pending} className={button('primary', 'lg', 'w-full')}>
        {isSignUp ? t('submitSignUp') : t('submitSignIn')}
      </button>

      <p className="text-sm text-muted">
        {isSignUp ? t('haveAccount') : t('noAccount')}{' '}
        <Link
          href={`${isSignUp ? '/sign-in' : '/sign-up'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="inline-flex min-h-11 items-center font-medium text-accent hover:underline"
        >
          {isSignUp ? t('submitSignIn') : t('submitSignUp')}
        </Link>
      </p>
    </form>
  )
}

function Field({ name, label, ...rest }: { name: string; label: string } & React.ComponentProps<'input'>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        className={field}
        {...rest}
      />
    </label>
  )
}
