import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../src/generated/prisma/client'

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
})

async function main() {
  // Настройки, которые правятся в админке без выката кода.
  const settings = {
    usdRate: '11900',
    fpsGpuConstant: '1350',
    fpsCpuConstant: '95',
  }
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, create: { key, value }, update: {} })
  }

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

  console.log(`seed: настройки записаны, администратор ${email} готов`)
}

main()
  .finally(() => db.$disconnect())
