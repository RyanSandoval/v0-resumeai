import { PrismaClient } from "@prisma/client"

async function main() {
  try {
    console.log("Initializing database...")
    const prisma = new PrismaClient()

    // Test connection
    await prisma.$connect()
    console.log("Database connection successful")

    // Push schema to database
    console.log("Pushing schema to database...")
    const { execSync } = require("child_process")
    execSync("npx prisma db push", { stdio: "inherit" })

    // Disconnect
    await prisma.$disconnect()
    console.log("Database initialization complete")
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  }
}

main()
