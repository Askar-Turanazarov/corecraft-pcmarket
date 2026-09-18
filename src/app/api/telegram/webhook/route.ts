import { timingSafeEqual } from 'node:crypto'
import { botApi, UZS_EXP } from '@/lib/telegram/bot'
import { checkPayable, markOrderPaid } from '@/lib/orders'

// Вебхук бота: подтверждение перед оплатой и фиксация успешной оплаты.
// Регистрация: setWebhook с url=<https-адрес>/api/telegram/webhook и secret_token=TELEGRAM_WEBHOOK_SECRET.

type Update = {
  pre_checkout_query?: { id: string; currency: string; total_amount: number; invoice_payload: string }
  message?: {
    successful_payment?: {
      currency: string
      total_amount: number
      invoice_payload: string
      telegram_payment_charge_id: string
    }
  }
}

const REFUSAL: Record<string, string> = {
  notPayable: 'Заказ уже оплачен или отменён.',
  outOfStock: 'Часть товаров закончилась — оформите заказ заново.',
  priceChanged: 'Цены изменились — оформите заказ заново.',
}

function secretOk(header: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || !header) return false
  const a = Buffer.from(header)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  // Чужой запрос не должен узнать ничего, даже что вебхук существует.
  if (!secretOk(request.headers.get('x-telegram-bot-api-secret-token'))) {
    return new Response(null, { status: 404 })
  }
  const update = (await request.json()) as Update

  const query = update.pre_checkout_query
  if (query) {
    const reason =
      query.currency !== 'UZS'
        ? 'priceChanged'
        : await checkPayable(query.invoice_payload, query.total_amount / UZS_EXP)
    await botApi('answerPreCheckoutQuery', {
      pre_checkout_query_id: query.id,
      ok: reason === null,
      ...(reason && { error_message: REFUSAL[reason] }),
    })
  }

  const payment = update.message?.successful_payment
  if (payment) {
    // Повторная доставка того же апдейта сюда тоже попадёт — markOrderPaid идемпотентен.
    await markOrderPaid(payment.invoice_payload, payment.telegram_payment_charge_id)
  }

  // Всегда 200: иначе Telegram будет повторять апдейт.
  return Response.json({ ok: true })
}
