import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/generated/prisma/client'

// Next.js в dev перезагружает модули на каждое изменение — без кэша
// на globalThis накопились бы десятки открытых подключений.
const globalForDb = globalThis as unknown as { db?: PrismaClient }

export const db =
  globalForDb.db ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
  })

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
