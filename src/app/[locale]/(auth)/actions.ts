'use server'

import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { signIn, credentialsSchema } from '@/lib/auth'
import { db } from '@/lib/db'

export type AuthState = { error?: string } | null

// Только путь внутри сайта: «//evil.com» и полные URL превратили бы вход в открытый редирект.
function safeNext(value: FormDataEntryValue | null): string {
  const next = value?.toString() ?? ''
  return /^\/(?![/\\])/.test(next) ? next : '/'
}

export async function signInAction(_: AuthState, form: FormData): Promise<AuthState> {
  try {
    await signIn('password', {
      email: form.get('email'),
      password: form.get('password'),
      redirectTo: safeNext(form.get('next')),
    })
    return null
  } catch (error) {
    // signIn бросает redirect-исключение при успехе — его пробрасываем дальше.
    if (error instanceof AuthError) return { error: 'invalidCredentials' }
    throw error
  }
}

export async function signUpAction(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  })
  if (!parsed.success) return { error: 'invalidCredentials' }

  const exists = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) return { error: 'emailTaken' }

  await db.user.create({
    data: {
      email: parsed.data.email,
      name: form.get('name')?.toString() || null,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  })

  return signInAction(null, form)
}
