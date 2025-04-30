"use server"

import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import type { OptimizationResult } from "@/components/resume-optimizer"

// In-memory storage for demo mode
const demoResumes: Record<
  string,
  {
    id: string
    title: string
    result: OptimizationResult
    jobUrl?: string
    createdAt: Date
  }
> = {}

// Simplified version without authentication
export async function saveResume(result: OptimizationResult, title = "Untitled Resume", jobUrl?: string) {
  try {
    // Generate a unique ID for the resume
    const resumeId = uuidv4()

    // Store the resume in our in-memory storage for demo mode
    demoResumes[resumeId] = {
      id: resumeId,
      title,
      result,
      jobUrl,
      createdAt: new Date(),
    }

    revalidatePath("/dashboard")
    return { success: true, resumeId }
  } catch (error) {
    console.error("Error saving resume:", error)
    return { success: false, error: "Failed to save resume" }
  }
}

export async function getUserResumes() {
  try {
    // Return resumes from our in-memory storage for demo mode
    const resumes = Object.values(demoResumes).map((resume) => ({
      id: resume.id,
      title: resume.title,
      createdAt: resume.createdAt,
      jobUrl: resume.jobUrl,
    }))

    return { success: true, resumes }
  } catch (error) {
    console.error("Error fetching resumes:", error)
    return { success: false, error: "Failed to fetch resumes" }
  }
}

export async function getResumeById(id: string) {
  try {
    // Get resume from our in-memory storage
    const resume = demoResumes[id]

    if (!resume) {
      return { success: false, error: "Resume not found" }
    }

    return {
      success: true,
      resume: {
        id: resume.id,
        title: resume.title,
        result: resume.result,
        jobUrl: resume.jobUrl,
        createdAt: resume.createdAt,
      },
    }
  } catch (error) {
    console.error("Error fetching resume:", error)
    return { success: false, error: "Failed to fetch resume" }
  }
}

export async function deleteResume(id: string) {
  try {
    // Delete from our in-memory storage
    if (demoResumes[id]) {
      delete demoResumes[id]
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error deleting resume:", error)
    return { success: false, error: "Failed to delete resume" }
  }
}

export async function updateResumeTitle(id: string, title: string) {
  try {
    // Update title in our in-memory storage
    if (demoResumes[id]) {
      demoResumes[id].title = title
    } else {
      return { success: false, error: "Resume not found" }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error updating resume title:", error)
    return { success: false, error: "Failed to update resume title" }
  }
}
