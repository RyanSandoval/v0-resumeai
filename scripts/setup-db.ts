import { PrismaClient } from "@prisma/client"

async function main() {
  const prisma = new PrismaClient()

  try {
    // Test the connection
    await prisma.$connect()
    console.log("Database connection successful")

    // Check if we can query the database
    const userCount = await prisma.user.count()
    console.log(`Current user count: ${userCount}`)

    console.log("Database setup complete")
  } catch (error) {
    console.error("Database setup failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
