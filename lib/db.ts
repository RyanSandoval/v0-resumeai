// This is a safer approach that uses dynamic imports for Prisma
// to avoid issues during build time

// Define a type for our database client
type PrismaClientType = any

// Create a function that dynamically imports and initializes Prisma
async function getPrismaClient(): Promise<PrismaClientType> {
  // Dynamically import PrismaClient only when needed
  const { PrismaClient } = await import("@prisma/client")

  // Initialize the client
  let prisma: PrismaClientType

  // In development, use a global variable to avoid multiple instances
  if (process.env.NODE_ENV === "development") {
    if (!(global as any).prisma) {
      ;(global as any).prisma = new PrismaClient()
    }
    prisma = (global as any).prisma
  } else {
    // In production, create a new instance
    prisma = new PrismaClient()
  }

  return prisma
}

// Export the function to get the client
export { getPrismaClient }
