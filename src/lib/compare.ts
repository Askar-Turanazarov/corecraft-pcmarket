import { cookies } from 'next/headers'

const COOKIE = 'compare'
export const MAX_COMPARE = 4

// Как и корзина — в cookie: переживает перезагрузку и работает без входа.
export async function readCompare(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value
  const list = raw?.split(',').filter(Boolean) ?? []
  return list.slice(0, MAX_COMPARE)
}

export async function writeCompare(slugs: string[]) {
  const store = await cookies()
  if (slugs.length === 0) return store.delete(COOKIE)
  store.set(COOKIE, slugs.slice(-MAX_COMPARE).join(','), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}
