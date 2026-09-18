import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Пропускаем api, статику и файлы с расширением — им локаль не нужна.
  matcher: '/((?!api|_next|_vercel|.*\..*).*)',
}
