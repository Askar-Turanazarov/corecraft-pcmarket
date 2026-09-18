import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../src/generated/prisma/client'
import { components } from './components'
import { games } from './games'

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
})

async function main() {
  // Настройки, которые правятся в админке без выката кода.
  const settings = {
    usdRate: '11900',
    fpsGpuConstant: '60',
    fpsCpuConstant: '60',
  }
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, create: { key, value }, update: {} })
  }
  // Константы FPS до Фазы 4 были заглушками (1350 и 95) — меняем, только если их никто не правил.
  await db.setting.updateMany({ where: { key: 'fpsGpuConstant', value: '1350' }, data: { value: '60' } })
  await db.setting.updateMany({ where: { key: 'fpsCpuConstant', value: '95' }, data: { value: '60' } })

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL и ADMIN_PASSWORD должны быть заданы в .env')
  }

  await db.user.upsert({
    where: { email },
    create: {
      email,
      name: 'Administrator',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(password, 10),
    },
    update: { role: 'ADMIN' },
  })

  // Ключ — slug: повторный запуск сида обновляет цены и остатки,
  // а не плодит дубликаты.
  for (const product of components) {
    await db.product.upsert({
      where: { slug: product.slug },
      create: product,
      update: product,
    })
  }

  for (const game of games) {
    await db.game.upsert({ where: { slug: game.slug }, create: game, update: game })
  }

  console.log(
    `seed: настройки записаны, администратор ${email} готов, товаров в каталоге ${await db.product.count()}, игр ${await db.game.count()}`,
  )
}

main()
  .finally(() => db.$disconnect())
