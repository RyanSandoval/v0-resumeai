import prisma from "@/lib/prisma"

export const getPrismaClient = () => {
  return prisma
}

export default prisma
