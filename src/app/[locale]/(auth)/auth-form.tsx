'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
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
    <form action={formAction} className="w-full max-w-sm space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <h1 className="text-2xl font-semibold">
        {isSignUp ? t('signUpTitle') : t('signInTitle')}
      </h1>

      {isSignUp && <Field name="name" label={t('name')} />}
      <Field name="email" type="email" label={t('email')} required />
      <Field name="password" type="password" label={t('password')} required minLength={8} />

      {state?.error && (
        <p className="text-sm text-danger">{t(state.error as 'invalidCredentials')}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent py-2.5 font-medium text-background hover:bg-accent-strong disabled:opacity-60"
      >
        {isSignUp ? t('submitSignUp') : t('submitSignIn')}
      </button>

      <p className="text-sm text-muted">
        {isSignUp ? t('haveAccount') : t('noAccount')}{' '}
        <Link
          href={`${isSignUp ? '/sign-in' : '/sign-up'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="text-accent hover:underline"
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
      <span className="text-sm text-muted">{label}</span>
      <input
        name={name}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
        {...rest}
      />
    </label>
  )
}
