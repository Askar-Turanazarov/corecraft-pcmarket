import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export type TelegramLoginData = {
  id: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: string
  hash: string
}

const WIDGET_FIELDS = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date'] as const

/** Данные виджета живут сутки — дальше их считаем протухшими. */
const MAX_AGE_SECONDS = 86400

/**
 * Подпись Telegram Login Widget: HMAC-SHA256 от строки проверки,
 * ключ — SHA256 от токена бота.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLogin(
  data: TelegramLoginData,
  botToken: string,
): boolean {
  const { hash } = data
  // Только поля виджета: Auth.js кладёт рядом csrfToken, callbackUrl и т.п., они в подпись не входят.
  const checkString = WIDGET_FIELDS.filter((key) => data[key])
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n')

  const secret = createHash('sha256').update(botToken).digest()
  const expected = createHmac('sha256', secret).update(checkString).digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(hash, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  // Без проверки срока перехваченную ссылку можно переиспользовать вечно.
  return Date.now() / 1000 - Number(data.auth_date) < MAX_AGE_SECONDS
}
