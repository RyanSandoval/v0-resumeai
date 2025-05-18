import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if the location field already exists
    const jobApplications = await prisma.jobApplication.findMany({
      take: 1,
      select: {
        // @ts-ignore - This is intentional to check if the field exists
        location: true,
      },
    })

    console.log("Location field already exists, no migration needed.")
    return
  } catch (error) {
    // If the field doesn't exist, we'll get an error, so we need to add it
    console.log("Adding location field to JobApplication table...")

    // Execute raw SQL to add the column
    // Note: This is PostgreSQL syntax
    await prisma.$executeRaw`ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "location" TEXT;`

    console.log("Location field added successfully!")
  }
}

main()
  .catch((e) => {
    console.error("Error during migration:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
