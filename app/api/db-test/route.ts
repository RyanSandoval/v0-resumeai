import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export async function GET() {
  const prisma = new PrismaClient()

  try {
    // Test database connection
    await prisma.$connect()

    // Get database information
    const result = await prisma.$queryRaw`SELECT current_database(), current_schema(), version()`

    return NextResponse.json({
      status: "ok",
      connection: "successful",
      databaseInfo: result,
    })
  } catch (error) {
    console.error("Database connection error:", error)

    return NextResponse.json(
      {
        status: "error",
        connection: "failed",
        error: error.message,
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
