import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { JobBoard } from "@/components/job-tracker/job-board"

export const metadata = {
  title: "Job Tracker - AI Resume Optimizer",
  description: "Track your job applications and manage your job search",
}

export default async function JobTrackerPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/jobs")
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <JobBoard />
    </main>
  )
}
