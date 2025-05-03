import { PrismaClient } from "@prisma/client"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Starting database migration...")

    // Run Prisma migrations
    await execAsync("npx prisma migrate deploy")
    console.log("Prisma migrations completed successfully")

    // Test database connection
    await prisma.$connect()
    console.log("Database connection successful")

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log("Database tables:", tables)

    console.log("Migration completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
