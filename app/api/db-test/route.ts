import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// Initialize Prisma Client
const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()

    // Get database information
    const databaseInfo = await prisma.$queryRaw`SELECT version()`

    // Get table count
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `

    return NextResponse.json({
      status: "ok",
      message: "Database connection successful",
      databaseInfo,
      tableCount,
    })
  } catch (error) {
    console.error("Database connection error:", error)

    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
