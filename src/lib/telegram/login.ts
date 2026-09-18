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
  const { hash, ...fields } = data

  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key as keyof typeof fields]}`)
    .join('\n')

  const secret = createHash('sha256').update(botToken).digest()
  const expected = createHmac('sha256', secret).update(checkString).digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(hash, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  // Без проверки срока перехваченную ссылку можно переиспользовать вечно.
  return Date.now() / 1000 - Number(data.auth_date) < MAX_AGE_SECONDS
}
