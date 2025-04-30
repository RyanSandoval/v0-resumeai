"use server"

import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import type { OptimizationResult } from "@/components/resume-optimizer"

// Create a new PrismaClient instance directly
const prisma = new PrismaClient()

// Helper function to get the session
async function getSession() {
  // Import auth options dynamically to avoid build-time issues
  const { authOptions } = await import("@/app/api/auth/[...nextauth]/route")
  return getServerSession(authOptions)
}

export async function saveResume(result: OptimizationResult, title = "Untitled Resume", jobUrl?: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to save a resume" }
  }

  try {
    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        title,
        originalText: result.originalText,
        optimizedText: result.optimizedText,
        jobDescription: result.jobDescription || "",
        jobUrl: jobUrl || "",
        keywords: result.keywords.matched.concat(result.keywords.missing),
        score: result.score,
      },
    })

    revalidatePath("/dashboard")
    return { success: true, resumeId: resume.id }
  } catch (error) {
    console.error("Error saving resume:", error)
    return { success: false, error: "Failed to save resume" }
  }
}

export async function getUserResumes() {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to view your resumes" }
  }

  try {
    const resumes = await prisma.resume.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, resumes }
  } catch (error) {
    console.error("Error fetching resumes:", error)
    return { success: false, error: "Failed to fetch resumes" }
  }
}

export async function getResumeById(id: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to view this resume" }
  }

  try {
    const resume = await prisma.resume.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!resume) {
      return { success: false, error: "Resume not found" }
    }

    return {
      success: true,
      resume: {
        ...resume,
        keywords: {
          matched: resume.keywords,
          missing: [],
        },
      },
    }
  } catch (error) {
    console.error("Error fetching resume:", error)
    return { success: false, error: "Failed to fetch resume" }
  }
}

export async function deleteResume(id: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to delete a resume" }
  }

  try {
    await prisma.resume.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error deleting resume:", error)
    return { success: false, error: "Failed to delete resume" }
  }
}

export async function updateResumeTitle(id: string, title: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to update a resume" }
  }

  try {
    await prisma.resume.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        title,
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error updating resume title:", error)
    return { success: false, error: "Failed to update resume title" }
  }
}
