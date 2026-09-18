'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(3).max(1000),
})

/** Один отзыв на товар от пользователя: повторная отправка заменяет прежний. */
export async function saveReview(productId: string, form: FormData) {
  const session = await auth()
  if (!session?.user?.id) return
  const parsed = reviewSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return

  const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } })
  if (!product) return
  await db.review.upsert({
    where: { productId_userId: { productId, userId: session.user.id } },
    create: { productId, userId: session.user.id, ...parsed.data },
    update: parsed.data,
  })
  revalidatePath('/', 'layout')
}
