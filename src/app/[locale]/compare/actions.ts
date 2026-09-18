'use server'

import { revalidatePath } from 'next/cache'
import { readCompare, writeCompare } from '@/lib/compare'
import { db } from '@/lib/db'

/** Добавить в сравнение или убрать, если уже там. Пятый товар вытесняет самый старый. */
export async function toggleCompare(slug: string) {
  const list = await readCompare()
  if (list.includes(slug)) {
    await writeCompare(list.filter((s) => s !== slug))
  } else if (await db.product.findUnique({ where: { slug }, select: { id: true } })) {
    await writeCompare([...list, slug])
  }
  revalidatePath('/', 'layout')
}
