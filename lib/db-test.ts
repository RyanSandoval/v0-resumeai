import { PrismaClient } from "@prisma/client"

export async function testDatabaseConnection() {
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT 1 as test`
    await prisma.$disconnect()
    return { success: true, result }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return { success: false, error }
  }
}
