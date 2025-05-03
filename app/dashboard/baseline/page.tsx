import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { BaselineResumeManager } from "@/components/baseline-resume-manager"

export const metadata = {
  title: "Baseline Resume - AI Resume Optimizer",
  description: "Manage your baseline resume for quick optimizations",
}

export default async function BaselineResumePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/baseline")
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Baseline Resume</h1>
      <p className="text-muted-foreground mb-6">
        Your baseline resume is used as a starting point for all optimizations. Upload it once and use it for all future
        job applications.
      </p>
      <div className="max-w-2xl">
        <BaselineResumeManager />
      </div>
    </main>
  )
}
