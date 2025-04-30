import { redirect } from "next/navigation"
import { ResumePreview } from "@/components/resume-preview"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import * as db from "@/lib/db"

interface ResumePageProps {
  params: {
    id: string
  }
}

export default async function ResumePage({ params }: ResumePageProps) {
  // Import and use getServerSession dynamically
  const { getServerSession } = await import("next-auth/next")
  const { authOptions } = await import("@/app/api/auth/[...nextauth]/route")

  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  try {
    // Initialize database if needed
    await db.initDatabase()

    // Get the resume
    const resume = await db.getResumeById(params.id, session.user.id)

    if (!resume) {
      return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <div className="container mx-auto px-4 py-6 md:py-12">
            <Button variant="outline" size="sm" asChild className="mb-6">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-700 dark:text-red-400">
              Resume not found.
            </div>
          </div>
        </main>
      )
    }

    // Create a dummy resumeFile object to satisfy the ResumePreview component
    const resumeFile = {
      file: new File([""], "resume.txt", { type: "text/plain" }),
      text: resume.original_text,
      type: "txt",
    }

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{resume.title}</h1>
          </div>

          <ResumePreview
            result={{
              originalText: resume.original_text,
              optimizedText: resume.optimized_text,
              jobDescription: resume.job_description,
              changes: [],
              keywords: {
                matched: resume.keywords,
                missing: [],
              },
              score: resume.score,
            }}
            resumeFile={resumeFile}
            jobDescription={resume.job_description}
            onBack={() => {}}
            onUpdate={() => {}}
            readOnly={true}
          />
        </div>
      </main>
    )
  } catch (error) {
    console.error("Resume page error:", error)

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-700 dark:text-red-400">
            An error occurred while fetching this resume.
          </div>
        </div>
      </main>
    )
  }
}
