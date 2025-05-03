"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveBaselineResume({
  resumeText,
  fileType,
  fileName,
}: {
  resumeText: string
  fileType: string
  fileName: string
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to save a baseline resume" }
    }

    // Check if user already has a baseline resume
    const existingBaseline = await prisma.baselineResume.findUnique({
      where: { userId: session.user.id },
    })

    if (existingBaseline) {
      // Update existing baseline
      await prisma.baselineResume.update({
        where: { id: existingBaseline.id },
        data: {
          resumeText,
          fileType,
          fileName,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new baseline
      await prisma.baselineResume.create({
        data: {
          userId: session.user.id,
          resumeText,
          fileType,
          fileName,
        },
      })
    }

    revalidatePath("/dashboard")
    revalidatePath("/resume/new")

    return { success: true }
  } catch (error) {
    console.error("Error saving baseline resume:", error)
    return { success: false, error: "Failed to save baseline resume" }
  }
}

export async function getBaselineResume() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to access your baseline resume" }
    }

    const baselineResume = await prisma.baselineResume.findUnique({
      where: { userId: session.user.id },
    })

    if (!baselineResume) {
      return { success: true, resume: null }
    }

    return {
      success: true,
      resume: baselineResume,
    }
  } catch (error) {
    console.error("Error getting baseline resume:", error)
    return { success: false, error: "Failed to get baseline resume" }
  }
}

export async function deleteBaselineResume() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to delete your baseline resume" }
    }

    await prisma.baselineResume.delete({
      where: { userId: session.user.id },
    })

    revalidatePath("/dashboard")
    revalidatePath("/resume/new")

    return { success: true }
  } catch (error) {
    console.error("Error deleting baseline resume:", error)
    return { success: false, error: "Failed to delete baseline resume" }
  }
}
