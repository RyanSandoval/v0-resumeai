"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getJobApplications() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to access job applications" }
    }

    const jobs = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })

    return { success: true, jobs }
  } catch (error) {
    console.error("Error getting job applications:", error)
    return { success: false, error: "Failed to get job applications" }
  }
}

export async function createJobApplication({
  title,
  company,
  jobDescription,
  jobUrl,
  notes,
  appliedDate,
}: {
  title: string
  company: string
  jobDescription: string
  jobUrl: string
  notes: string
  appliedDate: Date | null
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to create a job application" }
    }

    const job = await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        title,
        company: company || null,
        jobDescription: jobDescription || null,
        jobUrl: jobUrl || null,
        notes: notes || null,
        appliedDate,
        status: appliedDate ? "applied" : "want_to_apply",
      },
    })

    revalidatePath("/dashboard/jobs")

    return { success: true, job }
  } catch (error) {
    console.error("Error creating job application:", error)
    return { success: false, error: "Failed to create job application" }
  }
}

export async function updateJobApplication({
  id,
  title,
  company,
  jobDescription,
  jobUrl,
  notes,
  appliedDate,
}: {
  id: string
  title: string
  company: string
  jobDescription: string
  jobUrl: string
  notes: string
  appliedDate: Date | null
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to update a job application" }
    }

    // Verify ownership
    const existingJob = await prisma.jobApplication.findUnique({
      where: { id },
    })

    if (!existingJob || existingJob.userId !== session.user.id) {
      return { success: false, error: "Job application not found or you don't have permission to update it" }
    }

    const job = await prisma.jobApplication.update({
      where: { id },
      data: {
        title,
        company: company || null,
        jobDescription: jobDescription || null,
        jobUrl: jobUrl || null,
        notes: notes || null,
        appliedDate,
        // Update status to applied if an applied date is provided and status is want_to_apply
        status: appliedDate && existingJob.status === "want_to_apply" ? "applied" : existingJob.status,
      },
    })

    revalidatePath("/dashboard/jobs")

    return { success: true, job }
  } catch (error) {
    console.error("Error updating job application:", error)
    return { success: false, error: "Failed to update job application" }
  }
}

export async function updateJobStatus(jobId: string, status: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to update a job status" }
    }

    // Verify ownership
    const existingJob = await prisma.jobApplication.findUnique({
      where: { id: jobId },
    })

    if (!existingJob || existingJob.userId !== session.user.id) {
      return { success: false, error: "Job application not found or you don't have permission to update it" }
    }

    // Update the job status
    const job = await prisma.jobApplication.update({
      where: { id: jobId },
      data: {
        status,
        // If moving to applied and no applied date is set, set it to now
        appliedDate: status === "applied" && !existingJob.appliedDate ? new Date() : existingJob.appliedDate,
      },
    })

    revalidatePath("/dashboard/jobs")

    return { success: true, job }
  } catch (error) {
    console.error("Error updating job status:", error)
    return { success: false, error: "Failed to update job status" }
  }
}

export async function deleteJobApplication(jobId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to delete a job application" }
    }

    // Verify ownership
    const existingJob = await prisma.jobApplication.findUnique({
      where: { id: jobId },
    })

    if (!existingJob || existingJob.userId !== session.user.id) {
      return { success: false, error: "Job application not found or you don't have permission to delete it" }
    }

    // Delete the job
    await prisma.jobApplication.delete({
      where: { id: jobId },
    })

    revalidatePath("/dashboard/jobs")

    return { success: true }
  } catch (error) {
    console.error("Error deleting job application:", error)
    return { success: false, error: "Failed to delete job application" }
  }
}
