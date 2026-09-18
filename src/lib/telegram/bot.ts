// Минимальный клиент Telegram Bot API: один fetch, без SDK.

/** Без токена провайдера оплата идёт через локальную страницу-заглушку — бот и HTTPS не нужны. */
export const isMockPayments = () => !process.env.TELEGRAM_PROVIDER_TOKEN

// UZS в Bot API передаётся в минимальных единицах: exp = 2 (см. core.telegram.org/bots/payments/currencies.json).
export const UZS_EXP = 100
// Лимит Telegram на один счёт в UZS (max_amount из того же списка), в сумах.
export const MAX_INVOICE_UZS = 129_808_943

export async function botApi<T>(method: string, body: object): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан')
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { ok: boolean; result: T; description?: string }
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`)
  return data.result
}

/** Уведомление в чат — не должно ронять оформление заказа, поэтому ошибки только логируем. */
export async function notify(chatId: string | null | undefined, text: string) {
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN) return
  try {
    await botApi('sendMessage', { chat_id: chatId, text })
  } catch (error) {
    console.error('telegram notify:', error)
  }
}
