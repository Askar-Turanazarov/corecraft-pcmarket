import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from './db'
import { verifyTelegramLogin, type TelegramLoginData } from './telegram/login'

export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

// Сессии в JWT: Credentials-провайдер не умеет работать с сессиями в БД,
// поэтому адаптер и таблица сессий не нужны.
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in' },
  providers: [
    Credentials({
      id: 'password',
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user?.passwordHash) return null

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
        return ok ? { id: user.id, email: user.email, name: user.name } : null
      },
    }),

    Credentials({
      id: 'telegram',
      credentials: {},
      async authorize(raw) {
        const token = process.env.TELEGRAM_BOT_TOKEN
        const data = raw as unknown as TelegramLoginData
        if (!token || !data?.hash || !verifyTelegramLogin(data, token)) return null

        const user = await db.user.upsert({
          where: { telegramId: data.id },
          create: {
            telegramId: data.id,
            name: [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username,
            avatarUrl: data.photo_url,
          },
          update: { avatarUrl: data.photo_url },
        })
        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        // Роль читаем один раз при входе — на каждый запрос в БД не ходим.
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        token.uid = user.id
        token.role = dbUser?.role ?? 'USER'
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.uid as string
      session.user.role = token.role as string
      return session
    },
  },
})
