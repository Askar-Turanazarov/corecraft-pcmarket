import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyTelegramLogin, type TelegramLoginData } from '../telegram/login'

const TOKEN = '123456:test-token'

// Подписываем так же, как Telegram: data-check-string ключом SHA256(токена).
function signed(fields: Omit<TelegramLoginData, 'hash'>): TelegramLoginData {
  const check = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const key = createHash('sha256').update(TOKEN).digest()
  return { ...fields, hash: createHmac('sha256', key).update(check).digest('hex') }
}

const now = () => String(Math.floor(Date.now() / 1000))

describe('Telegram Login', () => {
  it('принимает подлинные данные, даже если Auth.js добавил свои поля', () => {
    const data = signed({ id: '42', first_name: 'Askar', username: 'askar', auth_date: now() })
    expect(verifyTelegramLogin({ ...data, csrfToken: 'x', callbackUrl: '/' } as TelegramLoginData, TOKEN)).toBe(true)
  })

  it('отклоняет подделку и чужой токен', () => {
    const data = signed({ id: '42', first_name: 'Askar', auth_date: now() })
    expect(verifyTelegramLogin({ ...data, id: '43' }, TOKEN)).toBe(false)
    expect(verifyTelegramLogin(data, '999:other')).toBe(false)
  })

  it('отклоняет данные старше суток', () => {
    const old = String(Math.floor(Date.now() / 1000) - 2 * 86400)
    expect(verifyTelegramLogin(signed({ id: '42', auth_date: old }), TOKEN)).toBe(false)
  })
})
