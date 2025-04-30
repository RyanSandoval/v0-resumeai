"use server"

import { getServerSession } from "next-auth/next"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import * as db from "@/lib/db"
import type { OptimizationResult } from "@/components/resume-optimizer"

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
    // Ensure user exists in database
    await db.createUser({
      id: session.user.id,
      name: session.user.name || undefined,
      email: session.user.email || undefined,
      image: session.user.image || undefined,
    })

    // Create resume
    const resume = await db.createResume({
      id: uuidv4(),
      userId: session.user.id,
      title,
      originalText: result.originalText,
      optimizedText: result.optimizedText,
      jobDescription: result.jobDescription || "",
      jobUrl: jobUrl || "",
      keywords: result.keywords.matched.concat(result.keywords.missing),
      score: result.score,
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
    const resumes = await db.getResumesByUserId(session.user.id)
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
    const resume = await db.getResumeById(id, session.user.id)

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
    await db.deleteResume(id, session.user.id)
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
    await db.updateResumeTitle(id, session.user.id, title)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error updating resume title:", error)
    return { success: false, error: "Failed to update resume title" }
  }
}
