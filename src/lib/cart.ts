import { cookies } from 'next/headers'
import { db } from './db'

const COOKIE = 'cart'
const MAX_QTY = 20

export type CartLine = { productId: string; qty: number }

// ponytail: корзина целиком в cookie (лимит 4 КБ). Для сборки ПК это
// десяток позиций — с запасом. Если понадобятся корзины на сотни позиций,
// переносить в таблицу Cart с привязкой к сессии.
export async function readCart(): Promise<CartLine[]> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function writeCart(lines: CartLine[]) {
  const store = await cookies()
  const kept = lines.filter((l) => l.qty > 0)
  if (kept.length === 0) {
    store.delete(COOKIE)
    return
  }
  store.set(COOKIE, JSON.stringify(kept), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

/** Корзина с подтянутыми товарами и суммой. Цены всегда из базы, не из cookie. */
export async function getCart() {
  const lines = await readCart()
  if (lines.length === 0) return { items: [], totalUzs: 0, count: 0 }

  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  })

  const items = lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId)
    // Товар мог быть удалён из каталога, пока лежал в корзине.
    return product ? [{ product, qty: line.qty }] : []
  })

  return {
    items,
    totalUzs: items.reduce((sum, i) => sum + i.product.priceUzs * i.qty, 0),
    count: items.reduce((sum, i) => sum + i.qty, 0),
  }
}

export function mergeLine(lines: CartLine[], productId: string, qty: number): CartLine[] {
  const rest = lines.filter((l) => l.productId !== productId)
  const clamped = Math.min(Math.max(qty, 0), MAX_QTY)
  return clamped > 0 ? [...rest, { productId, qty: clamped }] : rest
}
