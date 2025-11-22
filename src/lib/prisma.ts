import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// ใช้ DATABASE_URL จาก env ถ้ามี ไม่มีก็ fallback เป็นไฟล์ kpi.db ในโฟลเดอร์ database
const dbUrl = process.env.DATABASE_URL || 'file:./database/kpi.db'

const adapter = new PrismaLibSql({
  url: dbUrl,
})

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
